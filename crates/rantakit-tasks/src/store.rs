//! Small JSON files in the app data folder, one value each. The shell says
//! where that folder is.

use std::fs;
use std::io;
use std::marker::PhantomData;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::Serialize;
use serde::de::DeserializeOwned;

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error(transparent)]
    Io(#[from] io::Error),

    #[error(transparent)]
    Json(#[from] serde_json::Error),
}

pub type Result<T> = std::result::Result<T, StoreError>;

/// One value of `T` kept in a JSON file. A missing file reads as
/// `T::default()`; an unreadable one is moved aside and starts over.
pub struct JsonFile<T> {
    path: PathBuf,
    /// Serializes read-modify-write cycles between commands.
    lock: Mutex<()>,
    value: PhantomData<fn() -> T>,
}

impl<T: Serialize + DeserializeOwned + Default> JsonFile<T> {
    pub fn new(path: PathBuf) -> Self {
        Self {
            path,
            lock: Mutex::new(()),
            value: PhantomData,
        }
    }

    pub fn read(&self) -> Result<T> {
        let _guard = self.lock.lock().unwrap_or_else(|e| e.into_inner());
        self.load()
    }

    /// Reads the value, lets `change` edit it, and saves it.
    pub fn update<R>(&self, change: impl FnOnce(&mut T) -> R) -> Result<R> {
        let _guard = self.lock.lock().unwrap_or_else(|e| e.into_inner());
        let mut value = self.load()?;
        let out = change(&mut value);
        self.save(&value)?;
        Ok(out)
    }

    fn load(&self) -> Result<T> {
        let text = match fs::read_to_string(&self.path) {
            Ok(text) => text,
            Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(T::default()),
            Err(err) => return Err(err.into()),
        };
        match serde_json::from_str(&text) {
            Ok(value) => Ok(value),
            Err(err) => {
                // Keep the broken file for inspection and start over.
                eprintln!(
                    "{} is unreadable, moving it aside: {err}",
                    self.path.display()
                );
                fs::rename(&self.path, self.path.with_extension("json.corrupt"))?;
                Ok(T::default())
            }
        }
    }

    /// Writes to a temporary file first so a crash can't leave half a file.
    fn save(&self, value: &T) -> Result<()> {
        if let Some(dir) = self.path.parent() {
            fs::create_dir_all(dir)?;
        }
        let tmp = self.path.with_extension("json.tmp");
        fs::write(&tmp, serde_json::to_vec_pretty(value)?)?;
        fs::rename(&tmp, &self.path)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use serde::Deserialize;

    use super::*;

    #[derive(Debug, Default, PartialEq, Serialize, Deserialize)]
    struct Counter {
        n: u32,
    }

    fn scratch(test: &str) -> PathBuf {
        let dir = std::env::temp_dir().join("rantakit-store-tests").join(test);
        let _ = fs::remove_dir_all(&dir);
        dir.join("value.json")
    }

    #[test]
    fn a_missing_file_reads_as_the_default_and_updates_are_kept() {
        let path = scratch("missing");
        let file = JsonFile::<Counter>::new(path.clone());
        assert_eq!(file.read().unwrap(), Counter::default());

        file.update(|c| c.n += 2).unwrap();
        assert_eq!(JsonFile::<Counter>::new(path).read().unwrap().n, 2);
    }

    #[test]
    fn an_unreadable_file_is_moved_aside() {
        let path = scratch("broken");
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, "{ not json").unwrap();

        let file = JsonFile::<Counter>::new(path.clone());
        assert_eq!(file.read().unwrap(), Counter::default());
        assert!(path.with_extension("json.corrupt").exists());
    }
}
