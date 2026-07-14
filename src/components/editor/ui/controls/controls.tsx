import { Filters } from "./filters";
import { Format } from "./format";
import { Resize } from "./resize";
import { Submit } from "./submit";

export const Controls = () => (
	<div class="space-y-6 lg:col-span-4">
		<Format />
		<Resize />
		<Filters />
		<Submit />
	</div>
);
