import { useEditorStore } from "./model";
import { EditorArea, ImportArea } from "./ui";

export const Editor = () => {
	const image = useEditorStore((s) => s.state.image.path);

	if (!image) {
		return <ImportArea />;
	}

	return <EditorArea />;
};
