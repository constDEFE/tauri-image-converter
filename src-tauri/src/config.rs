// Centralized configuration constants shared across modules.

/// Maximum allowed image dimension (px) to prevent runaway memory use.
pub const MAX_DIMENSION: u32 = 16384;

/// Byte size above which `save_image` streams the encoded output to disk directly.
pub const SAVE_STREAM_THRESHOLD: usize = 10_000_000;

/// Maximum preview dimensions; images larger than either are downscaled.
pub const PREVIEW_MAX_WIDTH: u32 = 915;
pub const PREVIEW_MAX_HEIGHT: u32 = 2000;
