//! Files on Android. The pickers hand over `content://` addresses, while the
//! engines read and write paths: an Original is read through its open file,
//! a Task works on a copy in the app's cache, and each Result is then saved
//! as a new file in `Download/Rantakit/` through MediaStore.

use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};

use rantakit_tasks::{ErrorKind, FileInfo, ResultFile, result_name};
use tauri::{AppHandle, Manager};
use tauri_plugin_android_fs::{AndroidFsExt, FsUri, ImageFormat, PublicGeneralPurposeDir, Size};

/// The folder in `Download/` that Results are saved to.
const RESULTS_FOLDER: &str = "Rantakit";

/// Whether `path` is a `content://` address rather than a file path.
pub fn is_content(path: &Path) -> bool {
    path.to_str()
        .is_some_and(|path| path.starts_with("content://"))
}

fn uri(path: &Path) -> FsUri {
    FsUri::from_uri(path.to_string_lossy())
}

/// The name the picker showed, such as `ktp.jpg`, which the address itself
/// does not contain.
pub fn name(app: &AppHandle, path: &Path) -> Option<String> {
    let name = app.android_fs().get_name(&uri(path)).ok()?;
    Some(name.replace('/', "_"))
}

/// `rantakit_tasks::file_info` for a `content://` Original, read through
/// its open file so that nothing is copied.
pub fn file_info(app: &AppHandle, path: &Path) -> FileInfo {
    let fs = app.android_fs();
    let uri = uri(path);
    let info = fs
        .open_file_readable(&uri)
        .map(rantakit_tasks::file_info_of)
        .unwrap_or_default();
    FileInfo {
        size: info
            .size
            .filter(|&size| size > 0)
            .or_else(|| fs.get_len(&uri).ok()),
        ..info
    }
}

/// A small JPG of a `content://` photo, made by the system.
pub fn thumbnail(app: &AppHandle, path: &Path, size: u32) -> Option<Vec<u8>> {
    let preferred = Size {
        width: size,
        height: size,
    };
    let fs = app.android_fs();
    fs.get_thumbnail(&uri(path), preferred, ImageFormat::Jpeg)
        .ok()
        .flatten()
}

/// Android 9 and earlier need the storage permission to save Results; later
/// versions always have it.
pub async fn can_save(app: &AppHandle) -> bool {
    let storage = app.android_fs_async().public_storage();
    storage.check_permission().await.unwrap_or(false)
}

/// Shows the system's storage permission prompt when it is needed.
pub async fn ask_to_save(app: &AppHandle) -> bool {
    let storage = app.android_fs_async().public_storage();
    storage.request_permission().await.unwrap_or(false)
}

/// The copies one Task works on, in the app's cache. Removed when dropped.
pub struct Workspace {
    dir: PathBuf,
}

impl Workspace {
    pub fn new(app: &AppHandle, task: u64) -> io::Result<Self> {
        let dir = app
            .path()
            .app_cache_dir()
            .map_err(io::Error::other)?
            .join("tasks")
            .join(task.to_string());
        // A Task cut short by the app closing may have left its copies.
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("results"))?;
        Ok(Self { dir })
    }

    /// Where the engines write Results before they are saved.
    pub fn results(&self) -> PathBuf {
        self.dir.join("results")
    }

    /// Copies the `file`th Original in under its own name, so that its Result
    /// is named after it. A plain path is used as it is.
    pub fn copy_in(
        &self,
        app: &AppHandle,
        file: usize,
        original: &Path,
    ) -> Result<PathBuf, ErrorKind> {
        if !is_content(original) {
            return Ok(original.to_path_buf());
        }
        let name = name(app, original).unwrap_or_else(|| "file".into());
        let mut from = app
            .android_fs()
            .open_file_readable(&uri(original))
            .map_err(|err| ErrorKind::reading(&err.into()))?;
        let folder = self.dir.join(file.to_string());
        let copy = folder.join(name);
        fs::create_dir_all(&folder)
            .and_then(|()| io::copy(&mut from, &mut File::create(&copy)?))
            .map_err(|err| ErrorKind::writing(&err))?;
        Ok(copy)
    }

    /// Removes the `file`th Original's copy once its Result is saved.
    pub fn remove(&self, file: usize) {
        let _ = fs::remove_dir_all(self.dir.join(file.to_string()));
    }
}

impl Drop for Workspace {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.dir);
    }
}

/// Saves `result` as a new file in `Download/Rantakit/` and removes its copy
/// in the cache. The name follows the same rule as on desktop, counted
/// against the Results this app saved there before; MediaStore numbers any
/// other taken name itself, so no file is ever replaced.
pub fn save(
    app: &AppHandle,
    original: &Path,
    suffix: &str,
    result: ResultFile,
) -> Result<ResultFile, ErrorKind> {
    let fs = app.android_fs();
    let storage = fs.public_storage();
    let extension = result
        .path
        .extension()
        .unwrap_or_default()
        .to_string_lossy();
    #[allow(deprecated)]
    // Only to look for names already taken; the file is written through MediaStore.
    let folder = storage
        .resolve_path(None, PublicGeneralPurposeDir::Download)
        .map(|download| download.join(RESULTS_FOLDER))
        .ok();
    let taken = |name: &str| {
        folder
            .as_ref()
            .is_some_and(|folder| folder.join(name).exists())
    };
    let name = (1..1000)
        .map(|n| result_name(original, suffix, &extension, n))
        .find(|name| !taken(name))
        .unwrap_or_else(|| result_name(original, suffix, &extension, 1));

    let cannot_write = |err: tauri_plugin_android_fs::Error| ErrorKind::writing(&err.into());
    let uri = storage
        .create_new_file(
            None,
            PublicGeneralPurposeDir::Download,
            Path::new(RESULTS_FOLDER).join(&name),
            None,
        )
        .map_err(cannot_write)?;
    let written = fs
        .open_file_writable(&uri)
        .map_err(io::Error::from)
        .and_then(|mut to| {
            io::copy(&mut File::open(&result.path)?, &mut to)?;
            to.sync_all()
        });
    if let Err(err) = written {
        let _ = fs.remove_file(&uri);
        return Err(ErrorKind::writing(&err));
    }
    // Android 9 and earlier only show the file in Gallery and Files once scanned.
    let _ = storage.scan(&uri);
    let _ = fs::remove_file(&result.path);

    #[allow(deprecated)] // The path is what the Result page and History show.
    let path = storage
        .get_path(&uri)
        .unwrap_or_else(|_| folder.unwrap_or_default().join(&name));
    Ok(ResultFile { path, ..result })
}
