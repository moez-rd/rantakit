//! The contract every Rantakit engine follows: it reads an Original from a
//! path, writes its Result to an output path, reports progress, stops when
//! cancelled, and returns error kinds instead of messages. No file-format code
//! lives here.

mod error;
mod file;
mod progress;

pub use error::{ErrorKind, Result};
pub use file::{read_original, write_result};
pub use progress::{CancelToken, Progress, Tracker};
