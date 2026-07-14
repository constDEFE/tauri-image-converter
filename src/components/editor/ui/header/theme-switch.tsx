import { useTheme } from "@/shared/lib/theme";
import { MoonIcon, SunIcon } from "@/shared/ui/icons";

export const ThemeSwitch = () => {
	const { theme, toggleTheme } = useTheme();

	const isDarkTheme = theme === "dark";

	return (
		<button
			onClick={toggleTheme}
			class="button icon size-10 rounded-lg"
			title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
		>
			{isDarkTheme ? <MoonIcon class="size-6" /> : <SunIcon class="size-6" />}
		</button>
	);
};
