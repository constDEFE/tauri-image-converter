import { open } from "@tauri-apps/plugin-dialog";
import { useShallow } from "zustand/shallow";

import { NewImageIcon } from "@/shared/ui/icons";
import { cn } from "@/shared/utils/cn";

import { IMAGE_FORMATS, useFileDrop } from "../lib";
import { useEditorStore } from "../model";

import type { EditorStore } from "../model";
import type { Writable } from "@/shared/types/util";

const CN = {
	container:
		"border-secondary hover:border-accent hover:bg-surface focus-visible:outline-none group flex cursor-pointer flex-col items-center gap-4 rounded-lg border-2 border-dashed p-12 duration-100 ease-out",
	icon: "text-text group-hover:text-accent size-12 duration-100 ease-out"
};

const SELECT = (s: EditorStore) => ({
	isLoading: s.state.image.isLoading,
	loadImage: s.actions.loadImage
});

export const ImportArea = () => {
	const { isLoading, loadImage } = useEditorStore(useShallow(SELECT));

	useFileDrop(loadImage, null);

	const handleFileSelect = async () => {
		const selected = await open({
			multiple: false,
			filters: [{ name: "Image", extensions: IMAGE_FORMATS as Writable<typeof IMAGE_FORMATS> }]
		});

		if (!selected) {
			return;
		}

		await loadImage(selected);
	};

	return (
		<div class="bg-accent-inverted grid min-h-screen place-items-center">
			<button
				onClick={handleFileSelect}
				disabled={isLoading}
				class={cn(CN.container, isLoading && "pointer-events-none opacity-50")}
			>
				<NewImageIcon class={cn(CN.icon, isLoading && "text-accent animate-pulse")} />
				<div class="text-center">
					<p class="text-accent text-lg font-semibold">Click to select image</p>
					<p class="text-text text-sm">{IMAGE_FORMATS.join(", ").toUpperCase()}</p>
				</div>
			</button>
		</div>
	);
};
