const VIDEO_URL = (() => {
	const u = import.meta.env.VITE_VIDEO_URL;
	if (u.endsWith('/')) return u;
	return `${u}/`;
})();

const CLIP_URL = (() => {
	const u = import.meta.env.VITE_CLIP_URL;
	if (u.endsWith('/')) return u;
	return `${u}/`;
})();

export const getVideoURL = (fileName: string) => {
	const url = new URL(`${VIDEO_URL}${fileName.substring(0, 2).toLowerCase()}/${fileName}`);
	if (url.pathname.endsWith('mp4')) {
		url.pathname = `${url.pathname}/master.m3u8`;
	}
	return url.href;
};

export const getClipURL = (fileName: string) => {
	const url = new URL(`${CLIP_URL}${fileName.substring(0, 2).toLowerCase()}/${fileName}`);
	return url.href;
};
