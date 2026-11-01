use std::fs::{self, File};
use std::io::{self, BufWriter};
use std::path::{Path, PathBuf};

use crate::error::{ErrorKind, Result};
use crate::progress::Tracker;

/// Reads an Original whole.
pub fn read_original(path: &Path) -> Result<Vec<u8>> {
    fs::read(path).map_err(|e| ErrorKind::reading(&e))
}

/// Writes a Result to `output`, which must not exist yet. `write` fills a
/// temporary file next to it, which is renamed to `output` only when complete,
/// so a failed or cancelled write leaves nothing behind. Returns the Result's
/// size in bytes.
pub fn write_result(
    output: &Path,
    tracker: &mut Tracker<'_>,
    write: impl FnOnce(&mut BufWriter<File>) -> io::Result<()>,
) -> Result<u64> {
    if output.try_exists().unwrap_or(true) {
        return Err(ErrorKind::CannotWrite);
    }

    let part = part_path(output);
    let written = write_part(&part, write).and_then(|size| {
        // Last chance to stop before the Result appears.
        tracker.check()?;
        if output.try_exists().unwrap_or(true) {
            return Err(ErrorKind::CannotWrite);
        }
        fs::rename(&part, output).map_err(|e| ErrorKind::writing(&e))?;
        Ok(size)
    });

    match written {
        Ok(size) => {
            tracker.finish();
            Ok(size)
        }
        Err(kind) => {
            let _ = fs::remove_file(&part);
            Err(kind)
        }
    }
}

/// `ijazah (compressed).pdf` → `.ijazah (compressed).pdf.rantakit-part`.
fn part_path(output: &Path) -> PathBuf {
    let name = output.file_name().unwrap_or_default().to_string_lossy();
    output.with_file_name(format!(".{name}.rantakit-part"))
}

fn write_part(
    part: &Path,
    write: impl FnOnce(&mut BufWriter<File>) -> io::Result<()>,
) -> Result<u64> {
    let failed = |e: io::Error| ErrorKind::writing(&e);

    let mut file = BufWriter::new(File::create(part).map_err(failed)?);
    write(&mut file).map_err(failed)?;
    let file = file.into_inner().map_err(|e| failed(e.into_error()))?;

    Ok(file.metadata().map_err(failed)?.len())
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use super::*;
    use crate::progress::{CancelToken, Progress};

    fn scratch(test: &str) -> PathBuf {
        let dir = std::env::temp_dir().join("rantakit-core-tests").join(test);
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn files_in(dir: &Path) -> Vec<String> {
        let mut names: Vec<_> = fs::read_dir(dir)
            .unwrap()
            .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
            .collect();
        names.sort();
        names
    }

    #[test]
    fn writes_result_and_reports_done() {
        let dir = scratch("writes_result");
        let output = dir.join("photo (compressed).jpg");
        let mut seen = Vec::new();
        let mut progress = |p| seen.push(p);
        let cancel = CancelToken::new();
        let mut tracker = Tracker::new(&mut progress, &cancel);

        let size = write_result(&output, &mut tracker, |f| f.write_all(b"result")).unwrap();

        assert_eq!(size, 6);
        assert_eq!(fs::read(&output).unwrap(), b"result");
        assert_eq!(files_in(&dir), ["photo (compressed).jpg"]);
        assert_eq!(seen, [Progress::Fraction(1.0)]);
    }

    #[test]
    fn never_writes_over_an_existing_file() {
        let dir = scratch("existing_file");
        let output = dir.join("photo.jpg");
        fs::write(&output, b"original").unwrap();
        let cancel = CancelToken::new();
        let mut progress = |_| {};
        let mut tracker = Tracker::new(&mut progress, &cancel);

        let result = write_result(&output, &mut tracker, |f| f.write_all(b"result"));

        assert_eq!(result, Err(ErrorKind::CannotWrite));
        assert_eq!(fs::read(&output).unwrap(), b"original");
        assert_eq!(files_in(&dir), ["photo.jpg"]);
    }

    #[test]
    fn failed_write_leaves_nothing() {
        let dir = scratch("failed_write");
        let output = dir.join("result.pdf");
        let cancel = CancelToken::new();
        let mut progress = |_| {};
        let mut tracker = Tracker::new(&mut progress, &cancel);

        let result = write_result(&output, &mut tracker, |f| {
            f.write_all(b"half")?;
            Err(io::Error::from(io::ErrorKind::StorageFull))
        });

        assert_eq!(result, Err(ErrorKind::NotEnoughSpace));
        assert!(files_in(&dir).is_empty());
    }

    #[test]
    fn cancel_during_write_leaves_nothing() {
        let dir = scratch("cancel_during_write");
        let output = dir.join("result.pdf");
        let cancel = CancelToken::new();
        let mut progress = |_| {};
        let mut tracker = Tracker::new(&mut progress, &cancel);

        let result = write_result(&output, &mut tracker, |f| {
            cancel.cancel();
            f.write_all(b"result")
        });

        assert_eq!(result, Err(ErrorKind::Cancelled));
        assert!(files_in(&dir).is_empty());
    }

    #[test]
    fn missing_original_is_reported() {
        let dir = scratch("missing_original");

        assert_eq!(
            read_original(&dir.join("gone.jpg")),
            Err(ErrorKind::OriginalMissing)
        );
    }
}
