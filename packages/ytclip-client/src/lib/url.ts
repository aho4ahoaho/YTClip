const VIDEO_URL = (() => {
	const u = import.meta.env.VITE_VIDEO_URL ?? `${window.location.origin}/videos`;
	if (u.endsWith('/')) return u.substring(0, u.length - 1);
	return u;
})();

const CLIP_URL = (() => {
	const u = import.meta.env.VITE_CLIP_URL ?? `${window.location.origin}/clips`;
	if (u.endsWith('/')) return u.substring(0, u.length - 1);
	return u;
})();

const hlsPattern = /.*\.(mp4|avi|aac|mp3|ogg|flac|dts)/;
const dashPattern = /.*\.(mkv|webm|opus)/;
export type Source = {
	src: string;
	type: string;
};
export const getVideoURL = (fileName: string | null): Source[] => {
	if (!fileName) return [];
	const url = new URL(`${VIDEO_URL}/${fileName.substring(0, 2).toLowerCase()}/${fileName}`);
	const sources = [];
	if (url.pathname.match(hlsPattern)) {
		const hls_url = new URL(url);
		hls_url.pathname = `${hls_url.pathname}/master.m3u8`;
		sources.push({ src: hls_url.href, type: 'application/x-mpegURL' });
	}
	if (url.pathname.match(dashPattern)) {
		const dash_url = new URL(url);
		dash_url.pathname = `${dash_url.pathname}/manifest.mpd`;
		sources.push({ src: dash_url.href, type: 'application/dash+xml' });
	}
	sources.push({
		src: url.href,
		type: `video/${url.pathname.split('.').pop()}`
	});
	return sources;
};

export const getClipURL = (fileName: string) => {
	const url = new URL(`${CLIP_URL}/${fileName.substring(0, 2).toLowerCase()}/${fileName}`);
	return url.href;
};
