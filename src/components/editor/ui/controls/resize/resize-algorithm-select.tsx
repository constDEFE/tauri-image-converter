import type { ImageResizeAlgorithm } from "@/components/editor/model";
import type { EventHandlerFor } from "@/shared/types/react";

type Props = {
	id: string;
	disabled?: boolean;
	value: ImageResizeAlgorithm;
	onChange: EventHandlerFor<"select", "change">;
};

const OPTIONS: [ImageResizeAlgorithm, string][] = [
	["lanczos", "Lanczos"],
	["mitchell", "Mitchell"],
	["catmullrom", "Catmull-Rom"],
	["bilinear", "Bilinear"],
	["nearest", "Nearest Neighbor"]
];

export const ResizeAlgorithmSelect = ({ id, disabled, value, onChange }: Props) => (
	<div>
		<label htmlFor={id} class="text-text-secondary mb-1 block text-sm">
			Resize algorithm
		</label>
		<select id={id} class="input w-full rounded px-4 py-2" disabled={disabled} value={value} onChange={onChange}>
			{OPTIONS.map(([value, label]) => (
				<option value={value} key={value}>
					{label}
				</option>
			))}
		</select>
	</div>
);
