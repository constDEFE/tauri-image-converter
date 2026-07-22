use crate::cache::{BUFFER_POOL, IMAGE_CACHE};
use crate::config::MAX_DIMENSION;
use crate::encode::{calculate_preview_dimensions, encode_png_preview, save_image};
use crate::log::log_conversion;
use crate::options::{
    ConvertOptions, ResizeAlgorithm, SUPPORTED_FORMATS, parse_image_format, validate_options,
};
use crate::processing::{apply_filters, resize_image};
use crate::types::ImageData;
use image::{DynamicImage, ImageReader};
use std::path::Path;
use std::sync::Arc;
use tauri::command;
use tokio::task::spawn_blocking;

// Builds a downscaled, PNG-encoded preview from the given (already filtered) image
async fn build_preview(
    img: DynamicImage,
    original_width: u32,
    original_height: u32,
) -> Result<ImageData, String> {
    let (preview_width, preview_height, is_downscaled) =
        calculate_preview_dimensions(original_width, original_height);

    let preview_img = if is_downscaled {
        spawn_blocking(move || {
            resize_image(
                &img,
                preview_width,
                preview_height,
                ResizeAlgorithm::Bilinear,
            )
        })
        .await
        .map_err(|e| format!("Task error: {}", e))??
    } else {
        img
    };

    let estimated_size = (preview_width * preview_height * 4) as usize;
    let mut buffer = BUFFER_POOL.get(estimated_size);

    let preview_data = encode_png_preview(&preview_img)?;
    buffer.extend_from_slice(&preview_data);

    let result = Ok(ImageData {
        data: buffer.clone(),
        width: preview_width,
        height: preview_height,
        is_downscaled: if is_downscaled { Some(true) } else { None },
        original_width: if is_downscaled {
            Some(original_width)
        } else {
            None
        },
        original_height: if is_downscaled {
            Some(original_height)
        } else {
            None
        },
    });

    BUFFER_POOL.return_buffer(buffer);
    result
}

#[command]
pub async fn load_image(path: String) -> Result<ImageData, String> {
    let path_lower = path.to_lowercase();
    let has_valid_ext = SUPPORTED_FORMATS
        .iter()
        .any(|ext| path_lower.ends_with(ext));

    if !has_valid_ext {
        return Err("Invalid file type. Please select an image file".to_string());
    }

    // Magic byte detection
    let path_clone = path.clone();
    let img = spawn_blocking(move || {
        let reader =
            ImageReader::open(&path_clone).map_err(|e| format!("Failed to open file: {}", e))?;

        let reader = reader
            .with_guessed_format()
            .map_err(|e| format!("Failed to detect image format: {}", e))?;

        let format = reader.format();
        if format.is_none() {
            return Err(
                "Unable to determine image format. File may be corrupted or not a valid image"
                    .to_string(),
            );
        }

        reader
            .decode()
            .map_err(|e| format!("Failed to decode image: {}", e))
    })
    .await
    .map_err(|e| format!("Task error: {}", e))??;

    if img.width() > MAX_DIMENSION || img.height() > MAX_DIMENSION {
        return Err(format!(
            "Image too large. Maximum dimensions: {}x{}. Your image: {}x{}",
            MAX_DIMENSION,
            MAX_DIMENSION,
            img.width(),
            img.height()
        ));
    }

    let original_width = img.width();
    let original_height = img.height();

    IMAGE_CACHE.insert(path, img.clone());

    build_preview(img, original_width, original_height).await
}

#[command]
pub async fn preview_image(path: String, options: ConvertOptions) -> Result<ImageData, String> {
    validate_options(&options)?;

    let img = IMAGE_CACHE
        .get(&path)
        .ok_or_else(|| "Image not in cache. Please reload the image".to_string())?;

    let processed = spawn_blocking(move || apply_filters(img, &options, true))
        .await
        .map_err(|e| format!("Task error: {}", e))??;

    let original_width = processed.width();
    let original_height = processed.height();
    build_preview(processed, original_width, original_height).await
}

#[command]
pub async fn convert_image(
    path: String,
    output_path: String,
    options: ConvertOptions,
) -> Result<String, String> {
    validate_options(&options)?;

    let output_path_obj = Path::new(&output_path);
    if let Some(parent) = output_path_obj.parent() {
        if !parent.exists() {
            return Err(format!(
                "Output directory does not exist: {}",
                parent.display()
            ));
        }
    }

    let img = IMAGE_CACHE
        .get(&path)
        .or_else(|| image::open(&path).ok().map(Arc::new))
        .ok_or_else(|| "Failed to load image from cache or disk".to_string())?;

    let processed = spawn_blocking({
        let options = options.clone();
        move || apply_filters(img, &options, false)
    })
    .await
    .map_err(|e| format!("Task error: {}", e))??;

    let format = parse_image_format(&options.format)?;

    let output_path_clone = output_path.clone();
    let quality = options.quality;
    let format_type_clone = options.format_type.clone();
    spawn_blocking(move || {
        save_image(
            &processed,
            &output_path_clone,
            format,
            &format_type_clone,
            quality,
        )
    })
    .await
    .map_err(|e| format!("Task error: {}", e))??;

    // Don't clear cache - allow multiple conversions of the same image
    // Cache will be cleared when a new image is loade

    if let Err(e) = log_conversion(&path, &output_path, &options, "GUI", None) {
        eprintln!("Warning: Failed to write to log file: {}", e);
    }

    Ok(output_path)
}

pub fn convert_cli(
    input_path: String,
    output_path: Option<String>,
    format: Option<String>,
    format_type: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    brightness: Option<f32>,
    contrast: Option<f32>,
    grayscale: bool,
    negative: bool,
    quality: Option<u8>,
    resize_algorithm: Option<String>,
    batch_info: Option<(usize, usize)>,
) -> Result<(), String> {
    let input_path_obj = Path::new(&input_path);
    if !input_path_obj.exists() {
        return Err(format!("Input file does not exist: {}", input_path));
    }

    let img = image::open(&input_path).map_err(|e| format!("Failed to open image: {}", e))?;

    let format_str = format.unwrap_or_else(|| "png".to_string());
    let image_format = parse_image_format(&format_str)?;

    let format_type_str = format_type.unwrap_or_else(|| {
        if crate::options::is_format_lossless(&format_str) {
            "lossless".to_string()
        } else {
            "lossy".to_string()
        }
    });

    let output = output_path.unwrap_or_else(|| {
        let stem = input_path_obj
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("converted");
        let parent = input_path_obj.parent().unwrap_or(Path::new("."));
        parent
            .join(format!("{} - converted.{}", stem, format_str))
            .to_string_lossy()
            .to_string()
    });

    let output_path_obj = Path::new(&output);
    if let Some(parent) = output_path_obj.parent() {
        if !parent.exists() {
            return Err(format!(
                "Output directory does not exist: {}",
                parent.display()
            ));
        }
    }

    let options = ConvertOptions {
        format: format_str,
        format_type: format_type_str.clone(),
        width,
        height,
        brightness,
        contrast,
        grayscale,
        negative,
        quality,
        resize_algorithm,
    };

    validate_options(&options)?;

    let processed = apply_filters(Arc::new(img), &options, false)?;

    save_image(&processed, &output, image_format, &format_type_str, quality)?;

    if let Err(e) = log_conversion(&input_path, &output, &options, "CLI", batch_info) {
        eprintln!("Warning: Failed to write to log file: {}", e);
    }

    println!("Image converted successfully: {}", output);
    Ok(())
}
