export const extractFileName = (str: string) => {
	const start = str.lastIndexOf("\\");
	const end = str.lastIndexOf(".");

	return str.substring(start + 1, end);
};
