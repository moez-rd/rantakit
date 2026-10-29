use std::fs;
use std::path::{Path, PathBuf};

use dikompres_core::{ImageFormat, ImageOptions, OutputFormat, Target};
use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::Result;
use crate::history::{self, Entry, History};

/// Appended to the file name of every compressed copy.
const OUTPUT_SUFFIX: &str = "-dikompres";
const DEFAULT_QUALITY: u8 = 80;

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    Jpeg,
    Png,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageRequest {
    pub path: PathBuf,
    /// Output format; `None` keeps the input format.
    #[serde(default)]
    pub format: Option<Format>,
    #[serde(default = "default_quality")]
    pub quality: u8,
    /// When set, aim for this size instead of a fixed quality.
    #[serde(default)]
    pub max_bytes: Option<u64>,
    #[serde(default)]
    pub max_dimension: Option<u32>,
}

fn default_quality() -> u8 {
    DEFAULT_QUALITY
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageResult {
    pub input_path: PathBuf,
    pub output_path: PathBuf,
    /// "jpeg" or "png".
    pub format: &'static str,
    pub original_bytes: u64,
    pub compressed_bytes: u64,
    pub width: u32,
    pub height: u32,
    pub quality: Option<u8>,
}

/// Compress one image and save it next to the original as `<name>-dikompres.<ext>`.
/// The original is never overwritten. Successful runs are added to the history.
#[tauri::command]
pub async fn compress_image(
    history: State<'_, History>,
    request: ImageRequest,
) -> Result<ImageResult> {
    // Decoding and encoding are CPU-bound; keep them off the async runtime.
    let result = tauri::async_runtime::spawn_blocking(move || compress_blocking(request)).await??;

    // The file is already saved, so a history failure shouldn't fail the command.
    let created_at = history::now_ms();
    if let Err(err) = history.add(Entry {
        id: history::new_id(created_at),
        created_at,
        input_path: result.input_path.clone(),
        output_path: result.output_path.clone(),
        original_bytes: result.original_bytes,
        compressed_bytes: result.compressed_bytes,
        format: result.format.into(),
        width: result.width,
        height: result.height,
        quality: result.quality,
    }) {
        eprintln!("failed to record history: {err}");
    }

    Ok(result)
}

fn compress_blocking(request: ImageRequest) -> Result<ImageResult> {
    let input = fs::read(&request.path)?;

    let opts = ImageOptions {
        format: match request.format {
            None => OutputFormat::Same,
            Some(Format::Jpeg) => OutputFormat::To(ImageFormat::Jpeg),
            Some(Format::Png) => OutputFormat::To(ImageFormat::Png),
        },
        target: match request.max_bytes {
            Some(bytes) => Target::MaxBytes(bytes),
            None => Target::Quality(request.quality),
        },
        max_dimension: request.max_dimension,
    };
    let compressed = dikompres_core::compress_image(&input, &opts)?;

    let output_path = output_path(&request.path, compressed.format);
    fs::write(&output_path, &compressed.bytes)?;

    Ok(ImageResult {
        input_path: request.path,
        output_path,
        format: match compressed.format {
            ImageFormat::Jpeg => "jpeg",
            ImageFormat::Png => "png",
        },
        original_bytes: input.len() as u64,
        compressed_bytes: compressed.bytes.len() as u64,
        width: compressed.width,
        height: compressed.height,
        quality: compressed.quality,
    })
}

/// `photo.jpg` → `photo-dikompres.jpg`, then `photo-dikompres-2.jpg`, … if taken.
fn output_path(input: &Path, format: ImageFormat) -> PathBuf {
    let ext = match format {
        ImageFormat::Jpeg => "jpg",
        ImageFormat::Png => "png",
    };
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
    use super::*;

    #[test]
    fn output_path_adds_suffix_and_matches_format() {
        let dir = std::env::temp_dir().join("dikompres-output-path-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let input = dir.join("photo.png");

        assert_eq!(output_path(&input, ImageFormat::Jpeg), dir.join("photo-dikompres.jpg"));

        fs::write(dir.join("photo-dikompres.jpg"), b"").unwrap();
        assert_eq!(output_path(&input, ImageFormat::Jpeg), dir.join("photo-dikompres-2.jpg"));

        fs::remove_dir_all(&dir).unwrap();
    }
}
