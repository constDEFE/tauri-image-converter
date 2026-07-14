import type { ImageFormat } from "../model";

export const IMAGE_FORMATS = ["avif", "bmp", "gif", "ico", "jpg", "png", "webp", "ico"] as readonly ImageFormat[];

export const IMAGE_FORMATS_PROPERTIES_MAP: Record<ImageFormat, { lossless: boolean; lossy: boolean }> = {
	avif: {
		lossy: true,
		lossless: false
	},
	bmp: {
		lossy: false,
		lossless: true
	},
	gif: {
		lossy: true,
		lossless: false
	},
	ico: {
		lossy: false,
		lossless: true
	},
	jpeg: {
		lossy: true,
		lossless: false
	},
	png: {
		lossy: false,
		lossless: true
	},
	jpg: {
		lossy: true,
		lossless: false
	},
	webp: {
		lossy: true,
		lossless: true
	}
};
