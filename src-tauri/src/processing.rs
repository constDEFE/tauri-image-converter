use crate::options::{ConvertOptions, ResizeAlgorithm};
use fast_image_resize as fr;
use image::{DynamicImage, RgbaImage};
use rayon::prelude::*;
use std::sync::Arc;

pub fn resize_image(
    img: &DynamicImage,
    new_width: u32,
    new_height: u32,
    algorithm: ResizeAlgorithm,
) -> Result<DynamicImage, String> {
    let src_image = fr::images::Image::from_vec_u8(
        img.width(),
        img.height(),
        img.to_rgba8().into_raw(),
        fr::PixelType::U8x4,
    )
    .map_err(|e| e.to_string())?;

    let mut dst_image = fr::images::Image::new(new_width, new_height, src_image.pixel_type());

    let mut resizer = fr::Resizer::new();
    resizer
        .resize(
            &src_image,
            &mut dst_image,
            &fr::ResizeOptions::new()
                .resize_alg(fr::ResizeAlg::Convolution(algorithm.to_filter_type())),
        )
        .map_err(|e| e.to_string())?;

    drop(src_image);

    Ok(DynamicImage::ImageRgba8(
        RgbaImage::from_raw(new_width, new_height, dst_image.into_vec())
            .ok_or("Failed to create image from resized data")?,
    ))
}

#[inline]
fn apply_bc_pixel(pixel: &mut [u8], brightness: f32, contrast: f32) {
    let r = (pixel[0] as f32 + brightness).clamp(0.0, 255.0) as u8;
    let g = (pixel[1] as f32 + brightness).clamp(0.0, 255.0) as u8;
    let b = (pixel[2] as f32 + brightness).clamp(0.0, 255.0) as u8;

    let factor = (259.0 * (contrast + 255.0)) / (255.0 * (259.0 - contrast));
    pixel[0] = ((factor * (r as f32 - 128.0) + 128.0).clamp(0.0, 255.0)) as u8;
    pixel[1] = ((factor * (g as f32 - 128.0) + 128.0).clamp(0.0, 255.0)) as u8;
    pixel[2] = ((factor * (b as f32 - 128.0) + 128.0).clamp(0.0, 255.0)) as u8;
}

fn apply_brightness_contrast_parallel(pixels: &mut [u8], brightness: f32, contrast: f32) {
    pixels
        .par_chunks_mut(4)
        .for_each(|pixel| apply_bc_pixel(pixel, brightness, contrast));
}

pub fn apply_filters(
    img: Arc<DynamicImage>,
    options: &ConvertOptions,
    is_preview: bool,
) -> Result<DynamicImage, String> {
    let mut img = (*img).clone();

    let has_brightness = options.brightness.is_some();
    let has_contrast = options.contrast.is_some();

    // Apply grayscale first if needed (changes color space)
    if options.grayscale {
        img = DynamicImage::ImageLuma8(img.to_luma8());
    }

    if has_brightness && has_contrast {
        let brightness = options.brightness.unwrap();
        let contrast = options.contrast.unwrap();

        let mut rgba = img.to_rgba8();
        let pixels = rgba.as_mut();

        apply_brightness_contrast_parallel(pixels, brightness, contrast);

        img = DynamicImage::ImageRgba8(rgba);
    } else {
        if let Some(brightness) = options.brightness {
            img = img.brighten(brightness.round() as i32);
        }

        if let Some(contrast) = options.contrast {
            img = img.adjust_contrast(contrast);
        }
    }

    if options.negative {
        img.invert();
    }

    if let (Some(new_width), Some(new_height)) = (options.width, options.height) {
        if new_width != img.width() || new_height != img.height() {
            // Previews always use bilinear for speed; export respects the requested algorithm
            let algorithm = if is_preview {
                ResizeAlgorithm::Bilinear
            } else {
                options
                    .resize_algorithm
                    .as_ref()
                    .map(|s| ResizeAlgorithm::from_string(s))
                    .unwrap_or(ResizeAlgorithm::Lanczos)
            };

            img = resize_image(&img, new_width, new_height, algorithm)?;
        }
    }

    Ok(img)
}
