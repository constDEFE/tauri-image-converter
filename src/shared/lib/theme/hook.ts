import { useCallback, useSyncExternalStore } from "preact/compat";

import { LS_THEME } from "./constants";

import type { Theme } from "@tauri-apps/api/window";

const subscribe = (cb: () => void) => {
	window.addEventListener("themeUpdate", cb);

	return () => {
		window.removeEventListener("themeUpdate", cb);
	};
};

const getSnap = () => localStorage.getItem(LS_THEME) as Theme;

export const useTheme = () => {
	const theme = useSyncExternalStore<Theme>(subscribe, getSnap);

	const toggleTheme = useCallback(() => {
		const isDark = localStorage.getItem(LS_THEME) === "dark";

		if (isDark) {
			document.documentElement.classList.remove("dark");
			document.documentElement.classList.add("light");
		} else {
			document.documentElement.classList.remove("light");
			document.documentElement.classList.add("dark");
		}

		localStorage.setItem(LS_THEME, isDark ? "light" : "dark");
	}, []);

	return { theme, toggleTheme };
};
