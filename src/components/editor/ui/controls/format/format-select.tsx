import type { ImageFormat } from "@/components/editor/model";
import type { EventHandlerFor } from "@/shared/types/react";

type Props = {
	disabled?: boolean;
	value: ImageFormat;
	onChange: EventHandlerFor<"select", "change">;
};

const OPTIONS: [ImageFormat, string][] = [
	["png", "PNG"],
	["jpg", "JPG"],
	["webp", "WebP"],
	["bmp", "BMP"],
	["gif", "GIF"],
	["avif", "AVIF"],
	["ico", "ICO"]
];

export const FormatSelect = ({ disabled, value, onChange }: Props) => (
	<select class="input w-full rounded px-4 py-2" disabled={disabled} value={value} onChange={onChange}>
		{OPTIONS.map(([value, label]) => (
			<option value={value} key={value}>
				{label}
			</option>
		))}
	</select>
);
