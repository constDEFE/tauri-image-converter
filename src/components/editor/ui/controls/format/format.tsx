import { useShallow } from "zustand/shallow";

import { IMAGE_FORMATS_PROPERTIES_MAP } from "@/components/editor/lib";
import { useEditorStore } from "@/components/editor/model";
import { Slider } from "@/shared/ui";

import { FormatSelect } from "./format-select";

import type { EditorStore, ImageFormat, ImageFormatType } from "@/components/editor/model";
import type { EventHandlerFor } from "@/shared/types/react";
import type { ComponentProps } from "preact";

const SELECT = (s: EditorStore) => ({
	updateFields: s.actions.updateFields,
	isDisabled: s.state.isSubmitting || s.state.image.isLoading || s.state.preview.isLoading,
	format: s.state.options.format,
	formatType: s.state.options.formatType,
	quality: s.state.options.quality
});

export const Format = () => {
	const { format, formatType, isDisabled, quality, updateFields } = useEditorStore(useShallow(SELECT));

	const types = IMAGE_FORMATS_PROPERTIES_MAP[format];
	const showQuality = formatType === "lossy";

	const handleFormatChange: ComponentProps<typeof FormatSelect>["onChange"] = (e) => {
		const value = e.currentTarget.value as ImageFormat;
		const supportedTypes = IMAGE_FORMATS_PROPERTIES_MAP[value];
		const newType = supportedTypes.lossless ? "lossless" : "lossy";

		updateFields({ format: value, formatType: newType }, false);
	};

	const handleFormatTypeChange: EventHandlerFor<"input", "change"> = (e) => {
		updateFields({ formatType: e.currentTarget.value as ImageFormatType }, false);
	};

	const handleQualityChange: ComponentProps<typeof Slider>["onChange"] = (v) => {
		updateFields({ quality: v || 1 }, false);
	};

	return (
		<div class="surface rounded-lg p-4">
			<h3 class="text-accent mb-4 text-lg font-semibold">Output Format</h3>
			<FormatSelect disabled={isDisabled} value={format} onChange={handleFormatChange} />
			<div class="mt-4 flex items-center gap-4">
				<label class="flex items-center gap-2">
					<input
						type="radio"
						name="format-type"
						disabled={!types.lossless}
						checked={formatType === "lossless"}
						value="lossless"
						onChange={handleFormatTypeChange}
					/>
					<span class="text-accent font-medium">Lossless</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="radio"
						name="format-type"
						disabled={!types.lossy}
						checked={formatType === "lossy"}
						value="lossy"
						onChange={handleFormatTypeChange}
					/>
					<span class="text-accent font-medium">Lossy</span>
				</label>
			</div>
			{showQuality && (
				<Slider
					disabled={isDisabled}
					onChange={handleQualityChange}
					label={`Quality: ${quality}%`}
					max={100}
					min={1}
					value={quality}
					class="mt-4"
				/>
			)}
		</div>
	);
};
