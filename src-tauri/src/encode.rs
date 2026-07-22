use crate::config;
use image::{
    codecs::jpeg::JpegEncoder,
    codecs::png::{CompressionType, FilterType, PngEncoder},
    DynamicImage, ExtendedColorType, ImageEncoder, ImageFormat,
};
use ravif::{Encoder as RavifEncoder, Img};
use rgb::FromSlice;
use std::fs;
use webp::Encoder;

pub fn calculate_preview_dimensions(width: u32, height: u32) -> (u32, u32, bool) {
    let max_width = config::PREVIEW_MAX_WIDTH;
    let max_height = config::PREVIEW_MAX_HEIGHT;

    if width <= max_width && height <= max_height {
        return (width, height, false);
    }

    let width_ratio = max_width as f64 / width as f64;
    let height_ratio = max_height as f64 / height as f64;
    let ratio = width_ratio.min(height_ratio);

    let new_width = (width as f64 * ratio).round() as u32;
    let new_height = (height as f64 * ratio).round() as u32;

    (new_width, new_height, true)
}

// Previews are encoded as uncompressed PNG so alpha is preserved
pub fn encode_png_preview(img: &DynamicImage) -> Result<Vec<u8>, String> {
    // Normalize to 8-bit RGBA so any source color type (grayscale, RGB, 16-bit)
    // encodes safely and alpha is always present.
    let img = img.to_rgba8();
    let mut buffer = Vec::new();
    let encoder = PngEncoder::new_with_quality(
        &mut buffer,
        CompressionType::Uncompressed,
        FilterType::NoFilter,
    );
    encoder
        .write_image(
            img.as_raw(),
            img.width(),
            img.height(),
            ExtendedColorType::Rgba8,
        )
        .map_err(|e| e.to_string())?;
    Ok(buffer)
}

pub fn save_image(
    img: &DynamicImage,
    output_path: &str,
    format: ImageFormat,
    format_type: &str,
    quality: Option<u8>,
) -> Result<(), String> {
    let quality = if format_type == "lossless" {
        None
    } else {
        quality
    };

    if format == ImageFormat::Avif {
        let quality = quality.unwrap() as f32;
        let rgba = img.to_rgba8();
        let pixels = rgba.as_raw().as_rgba();
        let imgref = Img::new(pixels, img.width() as usize, img.height() as usize);
        let encoded = RavifEncoder::new()
            .with_quality(quality)
            .with_alpha_quality(quality)
            .with_speed(4)
            .encode_rgba(imgref)
            .map_err(|e| e.to_string())?;
        fs::write(output_path, &encoded.avif_file).map_err(|e| e.to_string())?;
        return Ok(());
    }

    if format == ImageFormat::WebP && format_type == "lossless" {
        let rgba_img = img.to_rgba8();
        let encoder = Encoder::from_rgba(&rgba_img, img.width(), img.height());
        let webp_data = encoder.encode_lossless();
        fs::write(output_path, &*webp_data).map_err(|e| e.to_string())?;
        return Ok(());
    }

    let estimated_size = (img.width() * img.height() * 4) as usize;

    if estimated_size > config::SAVE_STREAM_THRESHOLD {
        let file = fs::File::create(output_path).map_err(|e| e.to_string())?;
        let mut writer = std::io::BufWriter::new(file);

        if format == ImageFormat::Jpeg {
            let quality = quality.unwrap();
            let mut encoder = JpegEncoder::new_with_quality(&mut writer, quality);
            encoder.encode_image(img).map_err(|e| e.to_string())?;
        } else if format == ImageFormat::WebP {
            let quality = quality.unwrap() as f32;
            let rgba_img = img.to_rgba8();
            let encoder = Encoder::from_rgba(&rgba_img, img.width(), img.height());
            let webp_data = encoder.encode(quality);
            std::io::Write::write_all(&mut writer, &*webp_data).map_err(|e| e.to_string())?;
        } else {
            img.write_to(&mut writer, format)
                .map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    if format == ImageFormat::Jpeg {
        let quality = quality.unwrap();
        let mut buffer = crate::cache::BUFFER_POOL.get(estimated_size);
        let mut encoder = JpegEncoder::new_with_quality(&mut buffer, quality);
        encoder.encode_image(img).map_err(|e| e.to_string())?;
        fs::write(output_path, &buffer).map_err(|e| e.to_string())?;
        crate::cache::BUFFER_POOL.return_buffer(buffer);
    } else if format == ImageFormat::WebP {
        let quality = quality.unwrap() as f32;
        let rgba_img = img.to_rgba8();
        let encoder = Encoder::from_rgba(&rgba_img, img.width(), img.height());
        let webp_data = encoder.encode(quality);
        fs::write(output_path, &*webp_data).map_err(|e| e.to_string())?;
    } else {
        img.save_with_format(output_path, format)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
