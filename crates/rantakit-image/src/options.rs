#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ImageFormat {
    Jpeg,
    Png,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OutputFormat {
    Same,
    To(ImageFormat),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Target {
    Quality(u8),
    MaxBytes(u64),
}

#[derive(Debug, Clone)]
pub struct ImageOptions {
    pub format: OutputFormat,
    pub target: Target,
    pub max_dimension: Option<u32>,
}

#[derive(Debug, Clone)]
pub struct Compressed {
    /// Size of the Result in bytes.
    pub size: u64,
    pub format: ImageFormat,
    pub width: u32,
    pub height: u32,
    pub quality: Option<u8>,
}
