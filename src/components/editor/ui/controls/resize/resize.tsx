import { useCallback, useEffect, useState } from "preact/hooks";
import { useShallow } from "zustand/shallow";

import { useEditorStore } from "@/components/editor/model";

import { RatioFields } from "./ratio-fields";
import { ResizeAlgorithmSelect } from "./resize-algorithm-select";
import { ResizeFields } from "./resize-fields";

import type { EditorStore, ImageResizeAlgorithm } from "@/components/editor/model";
import type { ComponentProps } from "preact";

const gcd = (a: number, b: number): number => {
	return b === 0 ? a : gcd(b, a % b);
};

const SELECT = (s: EditorStore) => ({
	updateFields: s.actions.updateFields,
	width: s.state.options.width,
	height: s.state.options.height,
	isDisabled: s.state.isSubmitting || s.state.image.isLoading || s.state.preview.isLoading,
	originalWidth: s.state.image.size?.width || 0,
	originalHeight: s.state.image.size?.height || 0,
	resizeAlgorithm: s.state.options.resizeAlgorithm
});

export const Resize = () => {
	const [ratio, setRatio] = useState<[number, number]>([0, 0]);
	const { updateFields, isDisabled, height, width, originalWidth, originalHeight, resizeAlgorithm } = useEditorStore(
		useShallow(SELECT)
	);

	useEffect(() => {
		if (originalWidth > 0 && originalHeight > 0) {
			const divisor = gcd(originalWidth, originalHeight);

			setRatio([originalWidth / divisor, originalHeight / divisor]);
		}
	}, [originalWidth, originalHeight]);

	const handleSizeChange = useCallback(
		(type: "width" | "height", v: number) => {
			const [ratioWidth, ratioHeight] = ratio;

			if (ratioWidth > 0 && ratioHeight > 0) {
				const aspectRatio = ratioWidth / ratioHeight;

				if (type === "width") {
					const newHeight = Math.round(v / aspectRatio);

					updateFields({ width: v, height: newHeight });
				} else {
					const newWidth = Math.round(v * aspectRatio);

					updateFields({ height: v, width: newWidth });
				}
			} else {
				updateFields({ [type]: v });
			}
		},
		// oxlint-disable-next-line react-hooks/exhaustive-deps
		[ratio]
	);

	const handleRatioChange = useCallback(
		(type: "width" | "height", v: number) => {
			const [ratioWidth, ratioHeight] = ratio;

			if (type === "width") {
				setRatio([v, ratioHeight]);

				if (v > 0 && ratioHeight > 0) {
					const newHeight = Math.round(width / (v / ratioHeight));

					updateFields({ height: newHeight });
				}
			} else {
				setRatio([ratioWidth, v]);
				if (v > 0 && ratioWidth > 0) {
					const newHeight = Math.round(width / (ratioWidth / v));

					updateFields({ height: newHeight });
				}
			}
		},
		// oxlint-disable-next-line react-hooks/exhaustive-deps
		[ratio, width]
	);

	const handleAlgorithmChange: ComponentProps<typeof ResizeAlgorithmSelect>["onChange"] = useCallback((e) => {
		updateFields({ resizeAlgorithm: e.currentTarget.value as ImageResizeAlgorithm }, false);
	}, []);

	const disableAlgorithmSelect = originalWidth === width && originalHeight === height;

	return (
		<div class="surface rounded-lg p-4">
			<h3 class="text-accent mb-4 text-lg font-semibold">Resize</h3>
			<div class="space-y-4">
				<ResizeFields id="resize" disabled={isDisabled} height={height} width={width} onChange={handleSizeChange} />
				<RatioFields
					id="ratio"
					disabled={isDisabled}
					ratioWidth={ratio[0]}
					ratioHeight={ratio[1]}
					onChange={handleRatioChange}
				/>
				<ResizeAlgorithmSelect
					id="resize-algorithm"
					disabled={isDisabled || disableAlgorithmSelect}
					value={resizeAlgorithm}
					onChange={handleAlgorithmChange}
				/>
			</div>
		</div>
	);
};
