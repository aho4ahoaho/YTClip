import type { Video, VideoDetail, Clip } from '@ytclip/database';
import type { App } from '@ytclip/server';
import { edenTreaty } from '@elysiajs/eden';

export const API_URL = (() => {
	const u = import.meta.env.VITE_API_URL ?? `${window.location.origin}/api`;
	if (u.endsWith('/')) return u.substring(0, u.length - 1);
	return u;
})();

export const client = edenTreaty<App>('http://localhost:3000');
type OmitDateTime<T> = Omit<T, 'createdAt' | 'updatedAt'> & {
	createdAt?: string | Date;
	updatedAt?: string | Date;
};
export type ResponseVideo = OmitDateTime<Video> & {
	detail?: OmitDateTime<VideoDetail>;
	clips?: OmitDateTime<Clip>[];
};
