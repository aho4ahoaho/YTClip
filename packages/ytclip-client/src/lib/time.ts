export const formatTimes = (seconds: number, options: {
	digits?: number,
	hours?: boolean,
} = {}): string => {
	const digits = options.digits ?? 0;
	//後で比較するためにNumberのままにしておく
	const hours = getHours(seconds);
	//時間がある場合は60分で割った余りを取得する、ない場合は分にするだけ
	const minutes = (digits ? getMinutes(seconds) % 60 : getMinutes(seconds)).toString().padStart(2, '0')
	//秒数を取得する、小数点以下の桁数がある場合はその桁数に合わせる。+1は小数点
	const secondsLeft = (seconds % 60).toFixed(options.digits ?? 0).padStart(2 + (options.digits ? options.digits + 1 : 0), '0');

	let result = '';
	if (hours > 0 || options.hours) {
		result += `${hours.toString().padStart(2, '0')}:`;
	}

	result += `${minutes}:${secondsLeft}`;
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
