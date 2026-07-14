import { useShallow } from "zustand/shallow";

import { Checkbox, Slider } from "@/shared/ui";

import { useEditorStore } from "../../model";

import type { EditorStore } from "../../model";
import type { EventFor } from "@/shared/types/react";

const SELECT = (s: EditorStore) => ({
	updateFields: s.actions.updateFields,
	isDisabled: s.state.isSubmitting || s.state.image.isLoading || s.state.preview.isLoading,
	brightness: s.state.options.brightness,
	contrast: s.state.options.contrast,
	grayscale: s.state.options.grayscale,
	negative: s.state.options.negative
});

export const Filters = () => {
	const { brightness, contrast, grayscale, isDisabled, negative, updateFields } = useEditorStore(useShallow(SELECT));

	const handleBrightnessChange = (v: number) => {
		updateFields({ brightness: v || 0 });
	};

	const handleContrastChange = (v: number) => {
		updateFields({ contrast: v });
	};

	const handleCheckboxChange = (field: "grayscale" | "negative") => (e: EventFor<"input", "change">) => {
		updateFields({ [field]: e.currentTarget.checked });
	};

	return (
		<div class="surface rounded-lg p-4">
			<h3 class="text-accent mb-4 text-lg font-semibold">Filters</h3>
			<div class="space-y-4">
				<Slider
					disabled={isDisabled}
					onChange={handleBrightnessChange}
					label={`Brightness: ${brightness}`}
					max={150}
					min={-150}
					value={brightness}
				/>
				<Slider
					disabled={isDisabled}
					onChange={handleContrastChange}
					label={`Contrast: ${contrast}`}
					max={100}
					min={-100}
					value={contrast}
				/>
				<Checkbox disabled={isDisabled} checked={grayscale} onChange={handleCheckboxChange("grayscale")}>
					Grayscale
				</Checkbox>
				<Checkbox disabled={isDisabled} checked={negative} onChange={handleCheckboxChange("negative")}>
					Negative
				</Checkbox>
			</div>
		</div>
	);
};
