use fast_image_resize as fr;
use image::ImageFormat;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConvertOptions {
    pub format: String,
    #[serde(default)]
    pub format_type: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub brightness: Option<f32>,
    pub contrast: Option<f32>,
    pub grayscale: bool,
    pub negative: bool,
    pub quality: Option<u8>,
    #[serde(default)]
    pub resize_algorithm: Option<String>,
}

#[derive(Debug, Clone, Copy)]
pub enum ResizeAlgorithm {
    Lanczos,
    Bilinear,
    CatmullRom,
    Mitchell,
    Nearest,
}

impl ResizeAlgorithm {
    pub fn from_string(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "bilinear" => ResizeAlgorithm::Bilinear,
            "catmull" | "catmullrom" => ResizeAlgorithm::CatmullRom,
            "mitchell" => ResizeAlgorithm::Mitchell,
            "nearest" => ResizeAlgorithm::Nearest,
            _ => ResizeAlgorithm::Lanczos,
        }
    }

    pub fn to_filter_type(&self) -> fr::FilterType {
        match self {
            ResizeAlgorithm::Lanczos => fr::FilterType::Lanczos3,
            ResizeAlgorithm::Bilinear => fr::FilterType::Bilinear,
            ResizeAlgorithm::CatmullRom => fr::FilterType::CatmullRom,
            ResizeAlgorithm::Mitchell => fr::FilterType::Mitchell,
            ResizeAlgorithm::Nearest => fr::FilterType::Box,
        }
    }
}

pub fn parse_image_format(format_str: &str) -> Result<ImageFormat, String> {
    match format_str.to_lowercase().as_str() {
        "png" => Ok(ImageFormat::Png),
        "jpg" | "jpeg" => Ok(ImageFormat::Jpeg),
        "webp" => Ok(ImageFormat::WebP),
        "bmp" => Ok(ImageFormat::Bmp),
        "gif" => Ok(ImageFormat::Gif),
        "avif" => Ok(ImageFormat::Avif),
        "ico" => Ok(ImageFormat::Ico),
        _ => Err(format!("Unsupported format: {}", format_str)),
    }
}

fn validate_format_for_type(format: &str, format_type: &str) -> Result<(), String> {
    let lossy_formats = ["avif", "jpeg", "jpg", "webp"];
    let lossless_formats = ["bmp", "gif", "ico", "png", "webp"];

    let allowed = match format_type.to_lowercase().as_str() {
        "lossy" => &lossy_formats[..],
        "lossless" => &lossless_formats[..],
        other => {
            return Err(format!(
                "Invalid format_type: '{}'. Must be 'lossy' or 'lossless'",
                other
            ));
        }
    };

    if !allowed.iter().any(|f| f == &format.to_lowercase().as_str()) {
        return Err(format!(
            "Format '{}' is not allowed for format_type '{}'",
            format, format_type
        ));
    }

    Ok(())
}

pub fn validate_options(options: &ConvertOptions) -> Result<(), String> {
    if let Some(quality) = options.quality {
        if quality < 1 || quality > 100 {
            return Err(format!("Quality must be between 1-100, got {}", quality));
        }
    }

    if let Some(brightness) = options.brightness {
        if brightness < -150.0 || brightness > 150.0 {
            return Err(format!(
                "Brightness must be between -150 and 150, got {}",
                brightness
            ));
        }
    }

    if let Some(contrast) = options.contrast {
        if contrast < -100.0 || contrast > 100.0 {
            return Err(format!(
                "Contrast must be between -100 and 100, got {}",
                contrast
            ));
        }
    }

    if let (Some(w), Some(h)) = (options.width, options.height) {
        if w == 0 || h == 0 || w > 16384 || h > 16384 {
            return Err(format!(
                "Invalid dimensions: {}x{}. Must be between 1-16384",
                w, h
            ));
        }
    }

    if !options.format_type.is_empty() {
        validate_format_for_type(&options.format, &options.format_type)?;

        if options.format_type == "lossy" && options.quality.is_none() {
            return Err("Quality is required for lossy formats".to_string());
        }
    }

    Ok(())
}
