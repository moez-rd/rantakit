use std::path::{Path, PathBuf};

/// Where a Result goes: `ijazah.pdf` with the suffix `compressed` becomes
/// `<folder>/ijazah (compressed).pdf`, then `ijazah (compressed) (2).pdf`, …
/// when the name is taken, so no file is ever written over.
pub fn result_path(original: &Path, folder: &Path, suffix: &str, extension: &str) -> PathBuf {
    (1..)
        .map(|n| folder.join(result_name(original, suffix, extension, n)))
        .find(|path| !path.try_exists().unwrap_or(true))
        .expect("some name is always free")
}

/// The `n`th name `result_path` tries, counting from 1: `ijazah (compressed).pdf`,
/// then `ijazah (compressed) (2).pdf`. For folders the app cannot look into
/// through a path, such as `Download/` on Android.
pub fn result_name(original: &Path, suffix: &str, extension: &str, n: u32) -> String {
    let stem = original.file_stem().unwrap_or_default().to_string_lossy();
    match n {
        1 => format!("{stem} ({suffix}).{extension}"),
        n => format!("{stem} ({suffix}) ({n}).{extension}"),
    }
}

#[cfg(test)]
mod tests {
    use std::fs;

    use super::*;

    #[test]
    fn adds_suffix_and_counts_taken_names() {
        let dir = std::env::temp_dir().join("rantakit-tasks-names");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let original = dir.join("ijazah.pdf");

        let first = result_path(&original, &dir, "compressed", "pdf");
        assert_eq!(first, dir.join("ijazah (compressed).pdf"));

        fs::write(&first, b"").unwrap();
        let second = result_path(&original, &dir, "compressed", "pdf");
        assert_eq!(second, dir.join("ijazah (compressed) (2).pdf"));

        fs::write(&second, b"").unwrap();
        assert_eq!(
            result_path(&original, &dir, "compressed", "pdf"),
            dir.join("ijazah (compressed) (3).pdf")
        );
    }

    #[test]
    fn extension_follows_the_result_not_the_original() {
        let dir = std::env::temp_dir().join("rantakit-tasks-names-ext");

        assert_eq!(
            result_path(Path::new("foto.png"), &dir, "converted", "jpg"),
            dir.join("foto (converted).jpg")
        );
    }
}
