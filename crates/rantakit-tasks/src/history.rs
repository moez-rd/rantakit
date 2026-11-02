//! History, stored as one JSON file in the app data folder. The shell says
//! where that folder is.
//!
//! All access goes through [`History`], so the storage can later move to
//! SQLite without touching the shells or the frontend.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use rantakit_image::ImageFormat;
use serde::{Deserialize, Serialize};

use crate::catalogue::ToolId;
use crate::task::{Details, FileOutcome, ResultFile, Task, ToolOptions};

#[derive(Debug, thiserror::Error)]
pub enum HistoryError {
    #[error(transparent)]
    Io(#[from] io::Error),

    #[error(transparent)]
    Json(#[from] serde_json::Error),

    #[error("history was saved by a newer version of Rantakit (format {0})")]
    Newer(u32),
}

pub type Result<T> = std::result::Result<T, HistoryError>;

/// Bump when the file layout changes, and migrate older versions on load.
const VERSION: u32 = 1;
/// Oldest entries are dropped beyond this.
const MAX_ENTRIES: usize = 500;
/// How many Tools "Terakhir dipakai" (Recent tools) shows on Home.
pub const RECENT_TOOLS: usize = 4;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    /// The Tool that made this Result, by `ToolId::as_str`. Entries saved
    /// before Tools were recorded get one from their format on load.
    #[serde(default)]
    pub tool: String,
    /// Unix time in milliseconds.
    pub created_at: u64,
    pub input_path: PathBuf,
    pub output_path: PathBuf,
    pub original_bytes: u64,
    pub compressed_bytes: u64,
    /// "jpeg", "png" or "pdf".
    pub format: String,
    /// Pixel size for images; `None` for PDFs.
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub quality: Option<u8>,
}

#[derive(Serialize, Deserialize)]
struct HistoryFile {
    version: u32,
    /// Newest first.
    entries: Vec<Entry>,
}

pub struct History {
    path: PathBuf,
    /// Serializes read-modify-write cycles between commands.
    lock: Mutex<()>,
}

impl History {
    pub fn new(path: PathBuf) -> Self {
        Self {
            path,
            lock: Mutex::new(()),
        }
    }

    /// Entries, newest first.
    pub fn list(&self) -> Result<Vec<Entry>> {
        let _guard = self.lock.lock().unwrap_or_else(|e| e.into_inner());
        self.load()
    }

    /// The last Tools used, newest first, each once, at most [`RECENT_TOOLS`].
    pub fn recent_tools(&self) -> Result<Vec<String>> {
        let mut tools: Vec<String> = Vec::with_capacity(RECENT_TOOLS);
        for entry in self.list()? {
            if tools.len() == RECENT_TOOLS {
                break;
            }
            if !tools.contains(&entry.tool) {
                tools.push(entry.tool);
            }
        }
        Ok(tools)
    }

    pub fn add(&self, entry: Entry) -> Result<()> {
        self.update(|entries| {
            entries.insert(0, entry);
            entries.truncate(MAX_ENTRIES);
        })
    }

    /// Adds every Result of a finished Task, one entry per file.
    pub fn record(&self, task: &Task, outcomes: &[FileOutcome]) -> Result<()> {
        let created_at = now_ms();
        let added: Vec<Entry> = task
            .originals
            .iter()
            .zip(outcomes)
            .filter_map(|(original, outcome)| {
                let result = outcome.as_ref().ok()?;
                Some(entry(&task.tool, original, result, created_at))
            })
            .collect();
        if added.is_empty() {
            return Ok(());
        }

        self.update(|entries| {
            for entry in added {
                entries.insert(0, entry);
            }
            entries.truncate(MAX_ENTRIES);
        })
    }

    pub fn remove(&self, id: &str) -> Result<()> {
        self.update(|entries| entries.retain(|entry| entry.id != id))
    }

    pub fn clear(&self) -> Result<()> {
        self.update(Vec::clear)
    }

    fn update(&self, change: impl FnOnce(&mut Vec<Entry>)) -> Result<()> {
        let _guard = self.lock.lock().unwrap_or_else(|e| e.into_inner());
        let mut entries = self.load()?;
        change(&mut entries);
        self.save(entries)
    }

    fn load(&self) -> Result<Vec<Entry>> {
        let text = match fs::read_to_string(&self.path) {
            Ok(text) => text,
            Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(Vec::new()),
            Err(err) => return Err(err.into()),
        };

        match serde_json::from_str::<HistoryFile>(&text) {
            // Written by a newer app version: leave it untouched rather than lose data.
            Ok(file) if file.version > VERSION => Err(HistoryError::Newer(file.version)),
            Ok(file) => Ok(file.entries.into_iter().map(with_tool).collect()),
            Err(err) => {
                // Keep the broken file for inspection and start over.
                eprintln!("history file is unreadable, moving it aside: {err}");
                fs::rename(&self.path, self.path.with_extension("json.corrupt"))?;
                Ok(Vec::new())
            }
        }
    }

    /// Writes to a temporary file first so a crash can't leave a half-written history.
    fn save(&self, entries: Vec<Entry>) -> Result<()> {
        if let Some(dir) = self.path.parent() {
            fs::create_dir_all(dir)?;
        }
        let file = HistoryFile {
            version: VERSION,
            entries,
        };
        let tmp = self.path.with_extension("json.tmp");
        fs::write(&tmp, serde_json::to_vec_pretty(&file)?)?;
        fs::rename(&tmp, &self.path)?;
        Ok(())
    }
}

/// Fills in the Tool of an entry saved before Tools were recorded: only
/// Kompres Foto and Kompres PDF existed then.
fn with_tool(mut entry: Entry) -> Entry {
    if entry.tool.is_empty() {
        let tool = if entry.format == "pdf" {
            ToolId::KompresPdf
        } else {
            ToolId::KompresFoto
        };
        entry.tool = tool.as_str().into();
    }
    entry
}

fn entry(tool: &ToolOptions, original: &Path, result: &ResultFile, created_at: u64) -> Entry {
    let (format, width, height, quality) = match &result.details {
        Details::Photo {
            format,
            width,
            height,
            quality,
        } => {
            let format = match format {
                ImageFormat::Jpeg => "jpeg",
                ImageFormat::Png => "png",
            };
            (format, Some(*width), Some(*height), *quality)
        }
        Details::Pdf {
            images_recompressed,
            ..
        } => {
            // Only meaningful when an image was actually re-encoded.
            let quality = match tool {
                ToolOptions::KompresPdf(opts) if *images_recompressed > 0 => {
                    Some(opts.quality.clamp(1, 100))
                }
                _ => None,
            };
            ("pdf", None, None, quality)
        }
    };

    Entry {
        id: new_id(created_at),
        tool: tool.id().as_str().into(),
        created_at,
        input_path: original.to_path_buf(),
        output_path: result.path.clone(),
        original_bytes: result.original_size,
        compressed_bytes: result.size,
        format: format.into(),
        width,
        height,
        quality,
    }
}

/// Milliseconds since the Unix epoch.
pub(crate) fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

/// Unique within this machine: the timestamp plus a counter for same-millisecond entries.
pub(crate) fn new_id(created_at: u64) -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    format!(
        "{created_at:x}-{:x}",
        COUNTER.fetch_add(1, Ordering::Relaxed)
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(id: &str) -> Entry {
        used(id, "kompres-foto")
    }

    fn used(id: &str, tool: &str) -> Entry {
        Entry {
            id: id.into(),
            tool: tool.into(),
            created_at: 0,
            input_path: "in.jpg".into(),
            output_path: "in-rantakit.jpg".into(),
            original_bytes: 100,
            compressed_bytes: 50,
            format: "jpeg".into(),
            width: Some(1),
            height: Some(1),
            quality: Some(80),
        }
    }

    fn temp_history(name: &str) -> (History, PathBuf) {
        let dir = std::env::temp_dir().join(format!("rantakit-history-{name}"));
        let _ = fs::remove_dir_all(&dir);
        (History::new(dir.join("history.json")), dir)
    }

    #[test]
    fn add_remove_clear_round_trip() {
        let (history, dir) = temp_history("round-trip");
        assert!(history.list().unwrap().is_empty());

        history.add(entry("a")).unwrap();
        history.add(entry("b")).unwrap();
        let ids: Vec<_> = history.list().unwrap().into_iter().map(|e| e.id).collect();
        assert_eq!(ids, ["b", "a"], "newest entry should come first");

        history.remove("b").unwrap();
        assert_eq!(history.list().unwrap().len(), 1);

        history.clear().unwrap();
        assert!(history.list().unwrap().is_empty());
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn records_each_result_of_a_task_newest_first() {
        let (history, dir) = temp_history("record");
        let task = Task {
            tool: ToolOptions::KompresPdf(crate::PdfOptions {
                quality: 150,
                max_dimension: None,
                max_bytes: None,
            }),
            originals: vec!["a.pdf".into(), "b.pdf".into(), "c.pdf".into()],
            results_folder: None,
        };
        let done = |path: &str, images_recompressed| {
            Ok(ResultFile {
                path: path.into(),
                original_size: 100,
                size: 40,
                details: Details::Pdf {
                    images: 1,
                    images_recompressed,
                },
            })
        };

        let outcomes = [
            done("a (compressed).pdf", 1),
            Err(crate::ErrorKind::Damaged),
            done("c (compressed).pdf", 0),
        ];
        history.record(&task, &outcomes).unwrap();

        let entries = history.list().unwrap();
        let outputs: Vec<_> = entries.iter().map(|e| e.output_path.clone()).collect();
        assert_eq!(
            outputs,
            [
                PathBuf::from("c (compressed).pdf"),
                PathBuf::from("a (compressed).pdf")
            ]
        );
        assert_eq!(entries[0].quality, None, "no image was re-encoded");
        assert_eq!(entries[1].quality, Some(100));
        assert_eq!(entries[1].input_path, PathBuf::from("a.pdf"));
        assert_eq!(entries[1].tool, "kompres-pdf");
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn recent_tools_are_distinct_and_newest_first() {
        let (history, dir) = temp_history("recent");
        assert!(history.recent_tools().unwrap().is_empty());

        for (id, tool) in [
            ("1", "kompres-foto"),
            ("2", "kompres-pdf"),
            ("3", "kompres-foto"),
            ("4", "a"),
            ("5", "b"),
            ("6", "c"),
        ] {
            history.add(used(id, tool)).unwrap();
        }
        assert_eq!(
            history.recent_tools().unwrap(),
            ["c", "b", "a", "kompres-foto"]
        );
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn entries_from_before_tools_were_recorded_get_one_from_their_format() {
        let (history, dir) = temp_history("no-tool");
        fs::create_dir_all(&dir).unwrap();
        let old = |id: &str, format: &str| {
            format!(
                r#"{{"id":"{id}","createdAt":0,"inputPath":"a","outputPath":"b","originalBytes":2,"compressedBytes":1,"format":"{format}","width":null,"height":null,"quality":null}}"#
            )
        };
        let file = format!(
            r#"{{"version":1,"entries":[{},{}]}}"#,
            old("a", "pdf"),
            old("b", "jpeg")
        );
        fs::write(&history.path, file).unwrap();

        let tools: Vec<_> = history
            .list()
            .unwrap()
            .into_iter()
            .map(|e| e.tool)
            .collect();
        assert_eq!(tools, ["kompres-pdf", "kompres-foto"]);
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn keeps_at_most_max_entries() {
        let (history, dir) = temp_history("cap");
        let full = (0..MAX_ENTRIES)
            .rev()
            .map(|i| entry(&i.to_string()))
            .collect();
        history.save(full).unwrap();

        history.add(entry("new")).unwrap();
        let entries = history.list().unwrap();
        assert_eq!(entries.len(), MAX_ENTRIES);
        assert_eq!(entries[0].id, "new");
        assert_eq!(
            entries[MAX_ENTRIES - 1].id,
            "1",
            "oldest entry should be dropped"
        );
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn refuses_history_from_newer_version() {
        let (history, dir) = temp_history("newer");
        fs::create_dir_all(&dir).unwrap();
        fs::write(&history.path, r#"{"version":99,"entries":[]}"#).unwrap();

        assert!(matches!(history.list(), Err(HistoryError::Newer(99))));
        assert!(
            history.add(entry("a")).is_err(),
            "must not overwrite a newer file"
        );
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn moves_corrupt_file_aside() {
        let (history, dir) = temp_history("corrupt");
        fs::create_dir_all(&dir).unwrap();
        fs::write(&history.path, "not json").unwrap();

        assert!(history.list().unwrap().is_empty());
        assert!(dir.join("history.json.corrupt").exists());
        fs::remove_dir_all(dir).unwrap();
    }
}
