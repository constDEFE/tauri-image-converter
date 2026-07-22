import type { EditorStore } from "../model";

export const buildImageOptions = (options: EditorStore["state"]["options"]) => ({
	format: options.format,
	format_type: options.formatType,
	resize_algorithm: options.resizeAlgorithm,
	width: options.width,
	height: options.height,
	brightness: options.brightness,
	contrast: options.contrast,
	grayscale: options.grayscale,
	negative: options.negative,
	quality: options.quality
});
