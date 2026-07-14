import type { EventFor } from "@/shared/types/react";

type Props = {
	id: string;
	disabled?: boolean;
	width: number;
	height: number;
	onChange: (type: "width" | "height", v: number) => void;
};

export const ResizeFields = ({ id, width, height, onChange, disabled }: Props) => {
	const handleChange = (type: "width" | "height") => (e: EventFor<"input", "change">) => {
		onChange(type, e.currentTarget.valueAsNumber || 0);
	};

	const widthId = `${id}--width`;
	const heightId = `${id}--heigth`;

	return (
		<div class="flex items-center gap-4">
			<div class="flex-1">
				<label for={widthId} class="text-text mb-1 block text-sm">
					Width
				</label>
				<input
					id={widthId}
					disabled={disabled}
					type="number"
					min="1"
					max="16384"
					class="input w-full rounded px-4 py-2"
					value={width}
					onInput={handleChange("width")}
				/>
			</div>
			<div class="flex-1">
				<label for={heightId} class="text-text-secondary mb-1 block text-sm">
					Height
				</label>
				<input
					id={heightId}
					disabled={disabled}
					type="number"
					min="1"
					max="16384"
					class="input w-full rounded px-4 py-2"
					value={height}
					onInput={handleChange("height")}
				/>
			</div>
		</div>
	);
};
