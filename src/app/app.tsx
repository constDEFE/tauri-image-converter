import "./styles/index.css";

import { useHotkeys } from "@tanstack/react-hotkeys";

import { Editor } from "@/components/editor";
import { Toaster } from "@/shared/ui";
import { exitFullscreen, toggleFullscreen } from "@/shared/utils";

import { ErrorBoundary } from "./error-boundary";

export const App = () => {
	useHotkeys([
		{ hotkey: "F11", callback: toggleFullscreen, options: { ignoreInputs: false } },
		{ hotkey: "F", callback: toggleFullscreen },
		{ hotkey: "Escape", callback: exitFullscreen, options: { ignoreInputs: false } }
	]);

	return (
		<ErrorBoundary>
			<Toaster />
			<Editor />
		</ErrorBoundary>
	);
};
