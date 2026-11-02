//! The last Size limits used, offered as quick choices next to the Size
//! limit field. Kompres Foto and Kompres PDF share them.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::store::{JsonFile, Result};

/// How many Size limits are offered.
pub const RECENT_LIMITS: usize = 5;

#[derive(Default, Serialize, Deserialize)]
struct LimitsFile {
    /// In bytes, newest first.
    limits: Vec<u64>,
}

pub struct RecentLimits(JsonFile<LimitsFile>);

impl RecentLimits {
    pub fn new(path: PathBuf) -> Self {
        Self(JsonFile::new(path))
    }

    /// In bytes, newest first, each once.
    pub fn list(&self) -> Result<Vec<u64>> {
        Ok(self.0.read()?.limits)
    }

    /// Puts `limit` first, dropping an older copy and anything beyond [`RECENT_LIMITS`].
    pub fn record(&self, limit: u64) -> Result<()> {
        self.0.update(|file| {
            file.limits.retain(|&old| old != limit);
            file.limits.insert(0, limit);
            file.limits.truncate(RECENT_LIMITS);
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_last_five_limits_newest_first_without_duplicates() {
        let dir = std::env::temp_dir().join("rantakit-limits-tests");
        let _ = std::fs::remove_dir_all(&dir);
        let limits = RecentLimits::new(dir.join("recent-limits.json"));
        assert!(limits.list().unwrap().is_empty());

        for kb in [100, 200, 300, 200, 400, 500, 600] {
            limits.record(kb * 1024).unwrap();
        }
        let kb: Vec<u64> = limits.list().unwrap().iter().map(|b| b / 1024).collect();
        assert_eq!(kb, [600, 500, 400, 200, 300]);
    }
}
