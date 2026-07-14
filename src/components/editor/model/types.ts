import type { ImageSize } from "@tauri-apps/api/image";

export type ImageFormat = "png" | "jpg" | "jpeg" | "bmp" | "webp" | "avif" | "gif" | "ico";

export type ImageResizeAlgorithm = "bilinear" | "catmullrom" | "mitchell" | "nearest" | "lanczos";

export type ImageFormatType = "lossless" | "lossy";

export type ImageSizeType = keyof ImageSize;
