import { invoke } from "@tauri-apps/api/core";
import { save as saveDialog } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { create } from "zustand";

import { buildImageOptions, extractFileName } from "../lib";

import type { ImageFormat, ImageFormatType, ImageResizeAlgorithm } from "./types";
import type { ImageSize } from "@tauri-apps/api/image";

type ImageData = {
	data: number[];
	width: number;
	height: number;
	original_width: number;
	original_height: number;
};

type State = {
	image: {
		path: string | null;
		fileName: string | null;
		size: ImageSize | null;
		isLoading: boolean;
	};
	preview: {
		blobUrl: string | null;
		size: ImageSize | null;
		isLoading: boolean;
		isStale: boolean;
	};
	options: {
		format: ImageFormat;
		formatType: ImageFormatType;
		resizeAlgorithm: ImageResizeAlgorithm;
		quality: number;
		negative: boolean;
		grayscale: boolean;
		contrast: number;
		brightness: number;
		width: number;
		height: number;
	};
	isSubmitting: boolean;
};

type Actions = {
	loadImage: (path: string) => Promise<void>;
	updateFields: (fields: Partial<State["options"]>, shouldMarkStale?: boolean) => void;
	updatePreview: () => Promise<void>;
	submit: () => Promise<void>;
};

export type EditorStore = {
	state: State;
	actions: Actions;
};

const INITIAL_IMAGE_STATE: State["image"] = {
	fileName: null,
	size: null,
	path: null,
	isLoading: false
};

const INITIAL_PREVIEW_STATE: State["preview"] = {
	blobUrl: null,
	size: null,
	isLoading: false,
	isStale: false
};

const INITIAL_OPTIONS_STATE: State["options"] = {
	format: "png",
	formatType: "lossless",
	resizeAlgorithm: "lanczos",
	quality: 90,
	negative: false,
	grayscale: false,
	contrast: 0,
	brightness: 0,
	height: 0,
	width: 0
};

const INITIAL_STATE = {
	image: INITIAL_IMAGE_STATE,
	preview: INITIAL_PREVIEW_STATE,
	options: INITIAL_OPTIONS_STATE,
	isSubmitting: false
};

export const useEditorStore = create<EditorStore>((set, get) => ({
	state: INITIAL_STATE,
	actions: {
		loadImage: async (path) => {
			try {
				const store = get();
				if (path === store.state.image.path) {
					toast.message("Cannot load currently opened image");
					return;
				}
				set({ state: { ...store.state, image: { ...store.state.image, isLoading: true } } });

				const result: ImageData = await invoke("load_image", { path });
				const blob = new Blob([new Uint8Array(result.data)], { type: "image/webp" });
				const blobUrl = URL.createObjectURL(blob);
				const fileName = extractFileName(path);

				const originalSize = {
					width: result.original_width || result.width,
					height: result.original_height || result.height
				};

				const previewSize = {
					width: result.width,
					height: result.height
				};

				if (store.state.preview.blobUrl) {
					URL.revokeObjectURL(store.state.preview.blobUrl);
				}

				set({
					state: {
						isSubmitting: false,
						image: { path, fileName, isLoading: false, size: originalSize },
						options: { ...INITIAL_OPTIONS_STATE, height: originalSize.height, width: originalSize.width },
						preview: { blobUrl, isLoading: false, isStale: false, size: previewSize }
					}
				});
			} catch (error) {
				const store = get();

				set({ state: { ...store.state, image: { ...store.state.image, isLoading: false } } });
				toast.error(`Error loading image: ${error}`);
			}
		},
		updateFields: (fields, shouldMarkStale = true) => {
			set((s) => ({
				state: {
					...s.state,
					options: { ...s.state.options, ...fields },
					preview: { ...s.state.preview, isStale: shouldMarkStale || s.state.preview.isStale }
				}
			}));
		},
		updatePreview: async () => {
			try {
				set((s) => ({ state: { ...s.state, preview: { ...s.state.preview, isLoading: true } } }));

				const store = get();
				const parsedOptions = buildImageOptions(store.state.options);
				const res = await invoke<ImageData>("preview_image", {
					path: store.state.image.path,
					options: parsedOptions
				});

				if (store.state.preview.blobUrl) {
					URL.revokeObjectURL(store.state.preview.blobUrl);
				}

				const blob = new Blob([new Uint8Array(res.data)], { type: "image/png" });
				const blobUrl = URL.createObjectURL(blob);
				const { width, height } = res;

				set((s) => ({
					state: { ...s.state, preview: { blobUrl, size: { width, height }, isLoading: false, isStale: false } }
				}));
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);

				toast.error(`Error creating preview: ${message}`);
				set((s) => ({ state: { ...s.state, preview: { ...s.state.preview, isLoading: false } } }));
			}
		},
		submit: async () => {
			try {
				set((s) => ({ state: { ...s.state, isSubmitting: true } }));

				const store = get();
				const outputPath = await saveDialog({
					defaultPath: `${store.state.image.fileName} - converted.${store.state.options.format}`,
					filters: [{ name: "Image", extensions: [store.state.options.format] }]
				});

				if (!outputPath) {
					return;
				}

				const options = buildImageOptions(store.state.options);
				const mainPromise = invoke("convert_image", { path: store.state.image.path, outputPath, options });

				toast.promise(mainPromise, {
					loading: "Converting...",
					success: `"${store.state.image.fileName}" has been successfully converted to ${store.state.options.format}`,
					error: `Failed to convert ${store.state.image.fileName} to ${store.state.options.format}`
				});

				await mainPromise;
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);

				toast.error(`Error converting image: ${message}`);
			} finally {
				set((s) => ({ state: { ...s.state, isSubmitting: false } }));
			}
		}
	}
}));
