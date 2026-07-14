import { useShallow } from "zustand/shallow";

import { useFileDrop } from "../lib";
import { useEditorStore, type EditorStore } from "../model";
import { Controls } from "./controls";
import { Header } from "./header/header";
import { Preview } from "./preview";

const SELECT = (s: EditorStore) => ({
	loadImage: s.actions.loadImage,
	previewBlobUrl: s.state.preview.blobUrl
});

export const EditorArea = () => {
	const { loadImage, previewBlobUrl } = useEditorStore(useShallow(SELECT));

	useFileDrop(loadImage, previewBlobUrl);

	return (
		<div class="mx-auto min-h-screen max-w-360 p-4">
			<Header />
			<div class="grid gap-6 lg:grid-cols-9">
				<Preview />
				<Controls />
			</div>
		</div>
	);
};
