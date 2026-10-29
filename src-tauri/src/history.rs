//! Compression history, stored as one JSON file in the app data folder.
//!
//! All access goes through [`History`], so the storage can later move to
//! SQLite without touching the commands or the frontend.

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

/// Bump when the file layout changes, and migrate older versions on load.
const VERSION: u32 = 1;
/// Oldest entries are dropped beyond this.
const MAX_ENTRIES: usize = 500;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
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
        Self { path, lock: Mutex::new(()) }
    }

    /// Entries, newest first.
    pub fn list(&self) -> Result<Vec<Entry>> {
        let _guard = self.lock.lock().unwrap_or_else(|e| e.into_inner());
        self.load()
    }

    pub fn add(&self, entry: Entry) -> Result<()> {
        self.update(|entries| {
            entries.insert(0, entry);
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
            Err(err) if err.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
            Err(err) => return Err(err.into()),
        };

        match serde_json::from_str::<HistoryFile>(&text) {
            // Written by a newer app version: leave it untouched rather than lose data.
            Ok(file) if file.version > VERSION => Err(Error::NewerHistory(file.version)),
            Ok(file) => Ok(file.entries),
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
        let file = HistoryFile { version: VERSION, entries };
        let tmp = self.path.with_extension("json.tmp");
        fs::write(&tmp, serde_json::to_vec_pretty(&file)?)?;
        fs::rename(&tmp, &self.path)?;
        Ok(())
    }
}

/// Milliseconds since the Unix epoch.
pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

/// Unique within this machine: the timestamp plus a counter for same-millisecond entries.
pub fn new_id(created_at: u64) -> String {
    static COUNTER: AtomicU64 = AtomicU64::new(0);
    format!("{created_at:x}-{:x}", COUNTER.fetch_add(1, Ordering::Relaxed))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(id: &str) -> Entry {
        Entry {
            id: id.into(),
            created_at: 0,
            input_path: "in.jpg".into(),
            output_path: "in-dikompres.jpg".into(),
            original_bytes: 100,
            compressed_bytes: 50,
            format: "jpeg".into(),
            width: Some(1),
            height: Some(1),
            quality: Some(80),
        }
    }

    fn temp_history(name: &str) -> (History, PathBuf) {
        let dir = std::env::temp_dir().join(format!("dikompres-history-{name}"));
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
    fn keeps_at_most_max_entries() {
        let (history, dir) = temp_history("cap");
        let full = (0..MAX_ENTRIES).rev().map(|i| entry(&i.to_string())).collect();
        history.save(full).unwrap();

        history.add(entry("new")).unwrap();
        let entries = history.list().unwrap();
        assert_eq!(entries.len(), MAX_ENTRIES);
        assert_eq!(entries[0].id, "new");
        assert_eq!(entries[MAX_ENTRIES - 1].id, "1", "oldest entry should be dropped");
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn refuses_history_from_newer_version() {
        let (history, dir) = temp_history("newer");
        fs::create_dir_all(&dir).unwrap();
        fs::write(&history.path, r#"{"version":99,"entries":[]}"#).unwrap();

        assert!(matches!(history.list(), Err(Error::NewerHistory(99))));
        assert!(history.add(entry("a")).is_err(), "must not overwrite a newer file");
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
