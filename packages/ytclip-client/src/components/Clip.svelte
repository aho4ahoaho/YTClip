<script lang="ts">
	import type { Clip } from '@ytclip/database';
	import type Player from 'video.js/dist/types/player';
	import Button from './Button.svelte';
	import { LocaleFormatTimes } from '$lib/time';
	import { getClipURL } from '$lib/url';
	import { ProcessClip } from '$lib/api';

	export let clip: Pick<Clip, 'fileName' | 'processed' | 'start' | 'end' | 'id'>;
	export let index: number;
	export let player: Player | null = null;

	$: clipDuration = clip.end - clip.start;
</script>

<div class="my-1 flex items-center gap-4">
	<p class="text-lg">{index + 1}</p>
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
				ProcessClip(clip.id).catch(console.error);
			}}>切り出し</Button
		>
	{/if}
	<p>{LocaleFormatTimes(clipDuration)}</p>
</div>
