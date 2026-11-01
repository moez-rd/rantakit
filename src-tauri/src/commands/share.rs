use std::path::PathBuf;

use tauri::WebviewWindow;

/// Opens the system share sheet for Results ("Bagikan"). Windows only; the
/// frontend shows the button nowhere else, and elsewhere this does nothing.
#[tauri::command]
pub async fn share_files(window: WebviewWindow, paths: Vec<PathBuf>) {
    #[cfg(windows)]
    if let Err(error) = windows_share::share(&window, paths) {
        eprintln!("share failed: {error}");
    }
    #[cfg(not(windows))]
    let _ = (window, paths);
}

#[cfg(windows)]
mod windows_share {
    use std::cell::RefCell;
    use std::path::PathBuf;

    use tauri::WebviewWindow;
    use windows::ApplicationModel::DataTransfer::{DataRequestedEventArgs, DataTransferManager};
    use windows::Foundation::TypedEventHandler;
    use windows::Storage::{IStorageItem, StorageFile};
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::Shell::IDataTransferManagerInterop;
    use windows::core::{AgileReference, HSTRING, Interface, factory};
    use windows_collections::IIterable;

    thread_local! {
        /// The handler of the last share, removed before the next one is added.
        static HANDLER: RefCell<Option<(DataTransferManager, i64)>> = const { RefCell::new(None) };
    }

    pub fn share(
        window: &WebviewWindow,
        paths: Vec<PathBuf>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let title = paths
            .first()
            .and_then(|path| path.file_name())
            .map(|name| name.to_string_lossy().into_owned())
            .unwrap_or_default();
        // Opening the files waits on the system, so it happens here, off the UI thread.
        let items = paths
            .iter()
            .map(|path| {
                let file =
                    StorageFile::GetFileFromPathAsync(&HSTRING::from(path.as_os_str()))?.join()?;
                AgileReference::new(&file.cast::<IStorageItem>()?)
            })
            .collect::<windows::core::Result<Vec<_>>>()?;
        let hwnd = window.hwnd()?.0 as isize;

        window.run_on_main_thread(move || {
            if let Err(error) = show(HWND(hwnd as *mut _), title, items) {
                eprintln!("share failed: {error}");
            }
        })?;
        Ok(())
    }

    fn show(
        hwnd: HWND,
        title: String,
        items: Vec<AgileReference<IStorageItem>>,
    ) -> windows::core::Result<()> {
        let interop = factory::<DataTransferManager, IDataTransferManagerInterop>()?;
        let manager: DataTransferManager = unsafe { interop.GetForWindow(hwnd)? };

        if let Some((old, token)) = HANDLER.take() {
            old.RemoveDataRequested(token)?;
        }
        let token = manager.DataRequested(&TypedEventHandler::<
            DataTransferManager,
            DataRequestedEventArgs,
        >::new(move |_, args| {
            let Some(args) = args.as_ref() else {
                return Ok(());
            };
            let data = args.Request()?.Data()?;
            data.Properties()?
                .SetTitle(&HSTRING::from(title.as_str()))?;
            let files = items
                .iter()
                .map(|item| item.resolve().map(Some))
                .collect::<windows::core::Result<Vec<_>>>()?;
            data.SetStorageItemsReadOnly(&IIterable::<IStorageItem>::from(files))?;
            Ok(())
        }))?;
        HANDLER.set(Some((manager, token)));

        unsafe { interop.ShowShareUIForWindow(hwnd) }
    }
}
