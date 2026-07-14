import { useHotkey } from "@tanstack/react-hotkeys";
import { open } from "@tauri-apps/plugin-dialog";
import { memo } from "preact/compat";
import { useShallow } from "zustand/shallow";

import { NewImageIcon } from "@/shared/ui/icons";
import { cn } from "@/shared/utils";

import { IMAGE_FORMATS } from "../lib";
import { useEditorStore, type EditorStore } from "../model";

import type { Writable } from "@/shared/types/util";

const SELECT_STATE = (s: EditorStore) => ({
	isImageLoading: s.state.image.isLoading,
	isPreviewLoading: s.state.preview.isLoading,
	isSubmitting: s.state.isSubmitting,
	isStale: s.state.preview.isStale,
	previewUrl: s.state.preview.blobUrl,
	previewSize: s.state.preview.size,
	imageSize: s.state.image.size
});

const SELECT_ACTIONS = (s: EditorStore) => ({
	loadImage: s.actions.loadImage,
	updatePreview: s.actions.updatePreview
});

export const Preview = memo(() => {
	const { loadImage, updatePreview } = useEditorStore(useShallow(SELECT_ACTIONS));
	const { imageSize, isImageLoading, isSubmitting, isPreviewLoading, previewSize, isStale, previewUrl } =
		useEditorStore(useShallow(SELECT_STATE));

	const handleClick = async () => {
		if (isImageLoading || isPreviewLoading || isSubmitting) {
			return;
		}

		const selected = await open({
			multiple: false,
			filters: [{ name: "Image", extensions: IMAGE_FORMATS as Writable<typeof IMAGE_FORMATS> }]
		});

		if (!selected) {
			return;
		}

		await loadImage(selected);
	};

	useHotkey("R", updatePreview, {
		enabled: !isImageLoading && !isPreviewLoading && isStale,
		ignoreInputs: false
	});

	const isDownscaled = imageSize?.height !== previewSize?.height && imageSize?.width !== previewSize?.width;

	const previewCn = cn(
		"group relative cursor-pointer duration-200",
		(isImageLoading || isPreviewLoading) && "animate-pulse pointer-events-none",
		isSubmitting && "opacity-50 pointer-events-none"
	);

	return (
		<div class="surface self-start rounded-lg p-4 lg:col-span-5">
			<h3 class="text-accent mb-3 text-lg font-semibold">Preview</h3>
			<div class={previewCn} onClick={handleClick}>
				<img src={previewUrl!} alt="Preview" class="border-secondary w-full rounded border" />
				<div class="absolute inset-0 flex items-center justify-center rounded bg-black/0 transition-all duration-300 group-hover:bg-black/60">
					<div class="text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
						<NewImageIcon class="mx-auto mb-2 size-12 text-white" />
						<p class="text-lg font-semibold text-white">Change Image</p>
					</div>
				</div>
			</div>
			{imageSize && previewSize && (
				<p class="text-text mt-2 text-sm">
					Preview size: {previewSize.width}x{previewSize.height}
					{isDownscaled && ` (Original size: ${imageSize.width}x${imageSize.height})`}
				</p>
			)}
			{!isImageLoading && isStale && (
				<p class={cn("text-text mt-2 text-sm", isPreviewLoading && "opacity-50")}>
					Preview is stale, press{" "}
					<kbd className="bg-accent-inverted inline-block size-6 rounded-md border text-center font-mono font-semibold">
						R
					</kbd>{" "}
					to refresh it
				</p>
			)}
		</div>
	);
});
