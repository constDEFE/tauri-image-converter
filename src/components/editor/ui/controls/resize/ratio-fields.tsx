import type { EventFor } from "@/shared/types/react";

type Props = {
	id: string;
	disabled?: boolean;
	ratioWidth: number;
	ratioHeight: number;
	onChange: (type: "width" | "height", v: number) => void;
};

export const RatioFields = ({ id, ratioWidth, ratioHeight, onChange, disabled }: Props) => {
	const handleChange = (type: "width" | "height") => (e: EventFor<"input", "change">) => {
		onChange(type, e.currentTarget.valueAsNumber || 1);
	};

	const ratioWidthId = `${id}--ratio-width`;
	const ratioHeightId = `${id}--ratio-height`;

	return (
		<div class="flex items-center gap-4">
			<div class="flex-1">
				<label for={ratioWidthId} class="text-text-secondary mb-1 block text-sm">
					Aspect Ratio Width
				</label>
				<input
					id={ratioWidthId}
					disabled={disabled}
					type="number"
					min="1"
					max="10000"
					class="input w-full rounded px-4 py-2"
					value={ratioWidth}
					onInput={handleChange("width")}
				/>
			</div>
			<div class="flex-1">
				<label for={ratioHeightId} class="text-text-secondary mb-1 block text-sm">
					Aspect Ratio Height
				</label>
				<input
					id={ratioHeightId}
					disabled={disabled}
					type="number"
					min="1"
					max="10000"
					class="input w-full rounded px-4 py-2"
					value={ratioHeight}
					onInput={handleChange("height")}
				/>
			</div>
		</div>
	);
};
