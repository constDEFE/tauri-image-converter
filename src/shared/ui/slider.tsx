import { useCallback, useId } from "preact/hooks";

import type { EventFor } from "../types/react";
import type { Numberish } from "../types/util";

type Props = {
	label?: string;
	value?: Numberish;
	min?: Numberish;
	max?: Numberish;
	step?: Numberish;
	class?: string;
	disabled?: boolean;
	onChange: (value: number) => void;
};

const percent = (v: Numberish = 0, min: Numberish = 0, max: Numberish = 0) => {
	const [vNum, minNum, maxNum] = [v, min, max].map(Number) as [number, number, number];
	const percentValue = Math.round(((vNum - minNum) / (maxNum - minNum)) * 100) || 0;

	return `${percentValue}%`;
};

export const Slider = ({ value, label, onChange, max, min, step, disabled, class: cn }: Props) => {
	const id = useId();

	const handleChange = useCallback(
		(e: EventFor<"input", "change">) => onChange(e.currentTarget.valueAsNumber),
		[onChange]
	);

	return (
		<div class={cn}>
			<label for={id} class="mb-2 block text-sm">
				{label}
			</label>
			<div class="flex items-center gap-2">
				<input
					class="w-full"
					disabled={disabled}
					type="range"
					min={min}
					max={max}
					value={value}
					onInput={handleChange}
					step={step}
					style={{ "--progress-value": percent(value, min, max) }}
				/>
				<input
					id={id}
					disabled={disabled}
					type="number"
					min={min}
					max={max}
					value={value}
					onInput={handleChange}
					step={step}
					class="input w-20 rounded px-2 py-1 text-sm"
				/>
			</div>
		</div>
	);
};
