# Tauri Image Converter

A fast, lightweight desktop image converter for Windows with both GUI and CLI support. Built with Tauri 2, Rust, and Preact for optimal performance and minimal resource usage.

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB.svg)
![Rust](https://img.shields.io/badge/Rust-1.85+-orange.svg)

## Features

### Image Processing

- **Format Conversion**: Convert between PNG, JPG/JPEG, WebP, AVIF, BMP, GIF, and ICO
- **Resizing**: Custom dimensions with aspect ratio preservation
- **Quality Control**: Adjustable compression quality (1-100) for JPG, WebP, and AVIF
- **Filters**: Brightness, contrast, grayscale, and negative/invert effects
- **Batch Processing**: CLI mode supports processing multiple files

### Performance Optimizations

- **Multi-threaded Processing**: Brightness/contrast filters applied per-pixel in parallel using Rayon
- **Image Caching**: LRU cache to avoid reloading images
- **Memory Streaming**: Large images (>10MB) stream directly to disk
- **Fast Resizing**: High-performance algorithms via `fast_image_resize`

### Dual Interface

- **GUI Mode**: Intuitive drag-and-drop interface with real-time preview
- **CLI Mode**: Command-line interface for automation and batch processing

## Installation

### Prerequisites

- **Windows 10/11** (64-bit)
- **Bun** (package manager) - [Install Bun](https://bun.sh)
- **Rust** (1.85+) - [Install Rust](https://rustup.rs)

### Build from Source

```bash
# Clone the repository
git clone git@github.com:constDEFE/tauri-image-converter.git
cd tauri-image-converter

# Install dependencies
bun install

# Development mode
bun run tauri dev

# Build for production
bun run tauri build
```

The compiled executable will be in `src-tauri/target/release/`.

#### AVIF decoding prerequisites

AVIF **encoding** works out of the box, but AVIF **decoding** relies on
[`dav1d`](https://code.videolan.org/videolan/dav1d) (pulled in by the `image`
crate's `avif-native` feature). `dav1d-sys` builds it from source at compile
time, which requires the following native toolchain to be installed and on
`PATH`:

- **Git** — clones the dav1d source at build time (network access required)
- **Python 3** — required by Meson
- **Meson** + **Ninja** — `pip install meson ninja`
- **NASM** — dav1d's hand-written assembly
- **C toolchain** — Visual Studio 2022 Build Tools ("Desktop development with C++") or LLVM `clang-cl`

Alternatively, install a system `dav1d` via **vcpkg** (`vcpkg install dav1d`)
and expose its `pkg-config` on `PATH`; `dav1d-sys` will then link it and skip
the source build.

## Usage

### GUI Mode

Launch the application and:

1. Drag and drop an image or click to select
2. Choose output format (PNG, JPG, WebP, AVIF, BMP, GIF, ICO)
3. Adjust quality, resize dimensions, and apply filters
4. Click "Convert" to save the processed image

### CLI Mode

```bash
tauri-image-converter <INPUT>... [OPTIONS]

Options:
  -f, --format <FORMAT>             Output format [png|jpg|jpeg|webp|avif|bmp|gif|ico]
  --format-type <TYPE>              "lossy" or "lossless" (derived from format if omitted)
  -o, --out <PATH>                  Output file path (default: <stem> - converted.<format>)
  -q, --quality <QUALITY>           Quality (1-100) for lossy formats (JPG/WebP/AVIF)
  -w, --width <WIDTH>               Output width in pixels
  -H, --height <HEIGHT>             Output height in pixels
  -a, --resize-algorithm <ALGO>     Resize algorithm [lanczos|bilinear|catmullrom|mitchell|nearest]
  -b, --brightness <VALUE>          Brightness adjustment (-150 to 150)
  -c, --contrast <VALUE>            Contrast adjustment (-100 to 100)
  -g, --grayscale                   Convert to grayscale
  -n, --negative                    Apply negative/invert filter
  -t, --threads <NUM>               Number of threads for parallel processing (default: CPU cores)
```

Pass multiple `<INPUT>` paths to batch-convert. When `-o/--out` is omitted, each
output is written next to its source as `<stem> - converted.<format>`.

### Examples

```bash
# Convert PNG to WebP with 90% quality
tauri-image-converter input.png -f webp --format-type lossy -q 90

# Resize to 1920x1080 with the Lanczos algorithm
tauri-image-converter photo.jpg -w 1920 -H 1080 -a lanczos

# Apply filters and convert
tauri-image-converter image.png -f jpg -b 20 -c 10 -g

# Batch convert several files to lossy WebP
tauri-image-converter a.png b.jpg c.webp -f webp --format-type lossy -q 80
```

## Technology Stack

### Frontend

- **Preact** - Lightweight React alternative
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first styling
- **Zustand** - State management
- **TypeScript** - Type safety

### Backend

- **Tauri 2** - Desktop application framework
- **Rust** - High-performance image processing
- **image** - Core image operations (AVIF _encoding_ via `ravif`)
- **fast_image_resize** - Optimized resizing algorithms
- **webp** - WebP encoding
- **ravif** - AVIF encoding
- **dav1d** (via `image`'s `avif-native`) - AVIF decoding (native AV1 decoder)
- **Rayon** - Parallel processing
- **Tokio** - Async runtime

## Development

### Available Scripts

```bash
bun run dev              # Start development server
bun run build            # Build frontend (tsc + vite build)
bun run preview          # Preview the production frontend build
bun run tauri dev        # Run Tauri in development mode
bun run tauri build      # Build production executable
bun run lint             # Lint code (oxlint)
bun run lint:fix         # Auto-fix linting issues (oxlint --fix)
bun run format           # Format code (oxfmt)
bun run check            # Run tsc, oxlint, and oxfmt --check
```

### Configuration

Two build configurations are available:

- **Standard** (`tauri.conf.json`): WebView2 embed bootstrapper
- **Portable** (`portable_tauri.conf.json`): Bundled WebView2 runtime

To build portable version:

```bash
bun run tauri build --config src-tauri/portable_tauri.conf.json
```

## Supported Formats

| Format | Lossless | Lossy |
| ------ | -------- | ----- |
| PNG    | ✓        | -     |
| JPG    | -        | ✓     |
| AVIF\* | -        | ✓     |
| WebP   | ✓        | ✓     |
| BMP    | ✓        | -     |
| GIF    | ✓        | -     |
| ICO    | ✓        | -     |

\* AVIF **decoding** requires the native `dav1d` build toolchain — see
[AVIF decoding prerequisites](#avif-decoding-prerequisites).

## Resize Algorithms

- **Lanczos3** (default) - High quality, slower
- **Bilinear** - Good quality, fast
- **CatmullRom** - Sharp edges, good for text
- **Mitchell** - Balanced quality and performance
- **Nearest** - Fastest, pixelated results

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Tauri](https://tauri.app)
- Image processing powered by [image-rs](https://github.com/image-rs/image)
- Fast resizing via [fast_image_resize](https://github.com/Cykooz/fast_image_resize)
