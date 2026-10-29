//! Where compressed copies are written.

use std::path::{Path, PathBuf};

/// Appended to the file name of every compressed copy.
const OUTPUT_SUFFIX: &str = "-dikompres";

/// `photo.jpg` → `photo-dikompres.<ext>` next to the input, then
/// `photo-dikompres-2.<ext>`, … so an existing file is never overwritten.
pub fn output_path(input: &Path, ext: &str) -> PathBuf {
    let stem = input.file_stem().unwrap_or_default().to_string_lossy();
    let dir = input.parent().unwrap_or(Path::new(""));

    let mut candidate = dir.join(format!("{stem}{OUTPUT_SUFFIX}.{ext}"));
    let mut n = 2;
    while candidate.exists() {
        candidate = dir.join(format!("{stem}{OUTPUT_SUFFIX}-{n}.{ext}"));
        n += 1;
    }
    candidate
}

#[cfg(test)]
mod tests {
    use std::fs;

    use super::*;

    #[test]
    fn adds_suffix_and_skips_taken_names() {
        let dir = std::env::temp_dir().join("dikompres-output-path-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let input = dir.join("photo.png");

        assert_eq!(output_path(&input, "jpg"), dir.join("photo-dikompres.jpg"));

        fs::write(dir.join("photo-dikompres.jpg"), b"").unwrap();
        assert_eq!(output_path(&input, "jpg"), dir.join("photo-dikompres-2.jpg"));

        fs::remove_dir_all(&dir).unwrap();
    }
}
