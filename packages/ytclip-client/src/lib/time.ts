export const formatTimes = (seconds: number): string => {
	const hours = getHours(seconds);
	const minutes = getMinutes(seconds) % 60;
	const secondsLeft = seconds % 60;
	let result = '';
	if (hours > 0) {
		result += `${hours}:`;
	}
	if (minutes > 0) {
		result += `${minutes.toString().padStart(2, '0')}:`;
	}
	result += `${secondsLeft.toString().padStart(2, '0')}`;
	return result;
};

export const LocaleFormatTimes = (seconds: number): string => {
	return `${getMinutes(seconds)}分${(seconds % 60).toString().padStart(2, '0')}秒`;
};

export const getHours = (seconds: number): number => {
	return Math.floor(seconds / 3600);
};
export const getMinutes = (seconds: number): number => {
	return Math.floor(seconds / 60);
};
