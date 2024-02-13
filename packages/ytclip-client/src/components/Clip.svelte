<script lang="ts">
	import type { Clip } from '@ytclip/database';
	import type Player from 'video.js/dist/types/player';
	import Button from './Button.svelte';
	import { LocaleFormatTimes } from '$lib/time';
	import { getClipURL } from '$lib/url';
	import { client } from '$lib/api';
	import type { MouseElementEventHandler } from '$lib/type';

	export let clip: Pick<Clip, 'fileName' | 'processed' | 'start' | 'end' | 'id' | 'videoDataId'>;
	export let player: Player | null = null;
	export let videoId: string | null = null;
	export let onDelete: MouseElementEventHandler<HTMLButtonElement> | undefined = undefined;

	let className = '';
	export { className as class };

	$: clipDuration = clip.end - clip.start;
</script>

<div class="my-1 flex items-center gap-4 {className}">
	<Button
		class="w-24"
		onClick={() => {
			player?.currentTime(clip.start);
		}}>{LocaleFormatTimes(clip.start)}</Button
	>
	<Button
		class="w-24"
		onClick={() => {
			player?.currentTime(clip.end);
		}}>{LocaleFormatTimes(clip.end)}</Button
	>
	{#if clip.processed === 'Processed' && clip.fileName}
		<a href={getClipURL(clip.fileName)} download={clip.fileName}>
			<Button class="ml-2 w-24">保存する</Button>
		</a>
	{:else}
		<Button
			class="ml-2 w-24"
			onClick={() => {
				client.clip.process.get({
					$query: {
						clipId: clip.id
					}
				});
			}}>切り出し</Button
		>
	{/if}
	<p class="w-24">{LocaleFormatTimes(clipDuration)}</p>

	<Button
		class="ml-2 w-24"
		color="danger"
		onClick={(event) => {
			if (!videoId) return;
			client.clip.delete[videoId][clip.id].delete().catch(console.error);
			onDelete?.(event);
		}}
		disabled={!videoId}>削除</Button
	>
</div>
