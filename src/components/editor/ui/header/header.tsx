import { ThemeSwitch } from "./theme-switch";

export const Header = () => (
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-accent text-4xl font-bold">Image Converter</h1>
		<ThemeSwitch />
	</div>
);
