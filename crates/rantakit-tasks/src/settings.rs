//! Settings the backend acts on. Theme, text size, and language only change
//! the screen, so the frontend keeps those itself.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::store::{JsonFile, Result};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    /// "Simpan riwayat": whether finished Tasks are added to History.
    pub keep_history: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self { keep_history: true }
    }
}

pub struct SettingsStore(JsonFile<Settings>);

impl SettingsStore {
    pub fn new(path: PathBuf) -> Self {
        Self(JsonFile::new(path))
    }

    pub fn get(&self) -> Result<Settings> {
        self.0.read()
    }

    /// Changes some settings and returns them all.
    pub fn update(&self, change: impl FnOnce(&mut Settings)) -> Result<Settings> {
        self.0.update(|settings| {
            change(settings);
            settings.clone()
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn history_is_kept_until_turned_off() {
        let dir = std::env::temp_dir().join("rantakit-settings-tests");
        let _ = std::fs::remove_dir_all(&dir);
        let store = SettingsStore::new(dir.join("settings.json"));
        assert!(store.get().unwrap().keep_history);

        store.update(|s| s.keep_history = false).unwrap();
        assert!(
            !SettingsStore::new(dir.join("settings.json"))
                .get()
                .unwrap()
                .keep_history
        );
    }
}
