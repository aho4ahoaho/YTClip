import type { Video, VideoDetail, Clip } from '@ytclip/database';

export const API_URL = import.meta.env.VITE_API_URL;
type OmitDateTime<T> = Omit<T, 'createdAt' | 'updateAt'> & {
	createdAt?: string;
	updateAt?: string;
};
export type ResponseVideo = OmitDateTime<Video> & {
	detail?: OmitDateTime<VideoDetail>;
	clips?: OmitDateTime<Clip>[];
};
export const AddVideo = async (videoUrl: string): Promise<ResponseVideo> => {
	const url = new URL(`${API_URL}/video/add`);
	url.searchParams.append('url', videoUrl);
	const res = await fetch(url.href);
	if (res.status !== 200) {
		throw new Error(await res.text());
	}
	return await res.json();
};

export const GetVideoInfo = async (
	videoId: string,
	options: {
		detail?: boolean;
		clips?: boolean;
	} = {}
): Promise<ResponseVideo> => {
	const url = new URL(`${API_URL}/video/get`);
	url.searchParams.append('videoId', videoId);
	if (options.detail) {
		url.searchParams.append('detail', 'true');
	}
	if (options.clips) {
		url.searchParams.append('clips', 'true');
	}
	const res = await fetch(url.href);
	if (res.status !== 200) {
		throw new Error(await res.text());
	}
	return await res.json();
};

export const GetVideoList = async (): Promise<Pick<Video, 'videoId' | 'thumbnail' | 'title'>[]> => {
	const url = new URL(`${API_URL}/video/list`);
	const res = await fetch(url.href);
	if (res.status !== 200) {
		throw new Error(await res.text());
	}
	return await res.json();
};

export const GetClips = async (
	videoId: string
): Promise<{
	videoId: string;
	clips: Clip[];
}> => {
	const url = new URL(`${API_URL}/clip/get`);
	url.searchParams.append('videoId', videoId);
	const res = await fetch(url.href);
	if (res.status !== 200) {
		throw new Error(await res.text());
	}
	return await res.json();
};

export const CreateClip = async (videoId: string, start: number, end: number): Promise<Clip> => {
	const url = new URL(`${API_URL}/clip/create`);
	url.searchParams.append('videoId', videoId);
	url.searchParams.append('start', start.toString());
	url.searchParams.append('end', end.toString());
	const res = await fetch(url.href);
	if (res.status !== 200) {
		throw new Error(await res.text());
	}
	return await res.json();
};

export const ProcessClip = async (clipId: number): Promise<Clip> => {
	const url = new URL(`${API_URL}/clip/process`);
	url.searchParams.append('clipId', clipId.toString());
	const res = await fetch(url.href);
	if (res.status !== 200) {
		throw new Error(await res.text());
	}
	return await res.json();
};
