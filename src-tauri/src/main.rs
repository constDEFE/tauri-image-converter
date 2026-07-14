// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;

#[derive(Parser, Debug)]
#[command(name = "Image Converter")]
#[command(about = "Convert and process images", long_about = None)]
struct Args {
    /// Input image file path(s)
    #[arg(value_name = "INPUT")]
    input: Vec<String>,

    /// Output format (png, jpg, webp, bmp, gif, avif, ico)
    #[arg(short, long)]
    format: Option<String>,

    /// Format type: "lossy" or "lossless". If omitted, derived from format
    /// (png/bmp/ico => lossless, others => lossy).
    #[arg(long)]
    format_type: Option<String>,

    /// Output file path (default: input_converted.format)
    #[arg(short, long)]
    out: Option<String>,

    /// Quality for lossy formats (jpeg, webp, avif), 1-100
    #[arg(short, long)]
    quality: Option<u8>,

    /// Resize width
    #[arg(short, long)]
    width: Option<u32>,

    /// Resize height
    #[arg(short = 'H', long)]
    height: Option<u32>,

    /// Brightness adjustment (-100 to 100)
    #[arg(short, long)]
    brightness: Option<f32>,

    /// Contrast adjustment (0.0 to 2.0)
    #[arg(short, long)]
    contrast: Option<f32>,

    /// Convert to grayscale
    #[arg(short, long)]
    grayscale: bool,

    /// Apply negative/invert filter
    #[arg(short, long)]
    negative: bool,

    /// Number of threads for parallel processing (default: number of CPU cores)
    #[arg(short, long)]
    threads: Option<usize>,

    /// Resize algorithm for output images (lanczos, bilinear, catmullrom, mitchell, nearest)
    #[arg(short = 'a', long = "resize-algorithm")]
    resize_algorithm: Option<String>,
}

fn main() {
    let args = Args::parse();

    // Configure rayon thread pool if specified
    if let Some(threads) = args.threads {
        rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .build_global()
            .expect("Failed to initialize thread pool");
    }

    // If input files are provided, run in CLI mode
    if !args.input.is_empty() {
        let mut success_count = 0;
        let mut error_count = 0;
        let total = args.input.len();

        for (index, input_path) in args.input.iter().enumerate() {
            let current = index + 1;
            match tauri_app_lib::convert_cli(
                input_path.clone(),
                args.out.clone(),
                args.format.clone(),
                args.format_type.clone(),
                args.width,
                args.height,
                args.brightness,
                args.contrast,
                args.grayscale,
                args.negative,
                args.quality,
                args.resize_algorithm.clone(),
                if total > 1 {
                    Some((current, total))
                } else {
                    None
                },
            ) {
                Ok(_) => {
                    success_count += 1;
                    println!("✓ Converted: {}", input_path);
                }
                Err(e) => {
                    error_count += 1;
                    eprintln!("✗ Failed {}: {}", input_path, e);
                }
            }
        }

        if total > 1 {
            println!(
                "\nCompleted: {} successful, {} failed",
                success_count, error_count
            );
        }

        if error_count > 0 {
            std::process::exit(1);
        }
        std::process::exit(0);
    }

    tauri_app_lib::run()
}
