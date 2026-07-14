import { useShallow } from "zustand/shallow";

import { useEditorStore } from "../../model";

import type { EditorStore } from "../../model";

const SELECT = (s: EditorStore) => ({
	submit: s.actions.submit,
	isDisabled: s.state.isSubmitting || s.state.preview.isLoading || s.state.image.isLoading
});

export const Submit = () => {
	const { isDisabled, submit } = useEditorStore(useShallow(SELECT));

	const handleSubmit = async () => {
		if (isDisabled) return;
		submit();
	};

	return (
		<button onClick={handleSubmit} disabled={isDisabled} class="button w-full rounded-lg px-6 py-3 font-semibold">
			Convert & Save
		</button>
	);
};
