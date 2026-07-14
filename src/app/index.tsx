import { getCurrentWindow } from "@tauri-apps/api/window";
import { render } from "preact";

import { LS_THEME } from "@/shared/lib/theme";

import { App } from "./app";

import type { Theme } from "@tauri-apps/api/window";

const _originalSetItem = localStorage.setItem;

localStorage.setItem = function (...args: Parameters<typeof _originalSetItem>) {
	const res = _originalSetItem.apply(this, args);

	if (args[0] === LS_THEME) {
		window.dispatchEvent(new CustomEvent("themeUpdate"));
	}

	return res;
};

const initTheme = () => {
	const storedTheme = localStorage.getItem(LS_THEME) as Theme | null;
	const fallback = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

	let theme;
	if (storedTheme !== "dark" && storedTheme !== "light") {
		localStorage.setItem(LS_THEME, fallback);
		theme = fallback;
	} else {
		theme = storedTheme;
	}

	document.documentElement.classList.add(theme);
};

const init = async () => {
	try {
		initTheme();
	} catch (error) {
		console.error("Failed to initialize theme: ", error);
	}

	render(<App />, document.getElementById("root")!);

	await getCurrentWindow().show();
};

export { init };
