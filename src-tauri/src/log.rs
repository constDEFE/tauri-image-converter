use crate::options::ConvertOptions;
use chrono::Local;
use std::env;
use std::fs::OpenOptions;
use std::io::Write;

pub fn log_conversion(
    input_path: &str,
    output_path: &str,
    options: &ConvertOptions,
    mode: &str,
    batch_info: Option<(usize, usize)>, // (current, total)
) -> Result<(), String> {
    let exe_path = env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path
        .parent()
        .ok_or("Failed to get executable directory")?;
    let log_path = exe_dir.join("conversions.log");

    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S");
    let settings = format!(
        "format={} format_type={} quality={:?} resize_algorithm={} width={:?} height={:?} brightness={:?} contrast={:?} grayscale={} negative={}",
        options.format,
        options.format_type,
        options.quality,
        options.resize_algorithm.as_deref().unwrap(),
        options.width,
        options.height,
        options.brightness,
        options.contrast,
        options.grayscale,
        options.negative
    );

    let batch_suffix = match batch_info {
        Some((current, total)) => format!(" [batch {}/{}]", current, total),
        None => String::new(),
    };

    let log_entry = format!(
        "{} | {} | {} | {} | {}{}\n",
        timestamp, input_path, output_path, settings, mode, batch_suffix
    );

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
        .map_err(|e| e.to_string())?;

    file.write_all(log_entry.as_bytes())
        .map_err(|e| e.to_string())?;

    Ok(())
}
