<script lang="ts">
	import { GetVideoInfo } from '$lib/api';
	import {  getVideoURL } from '$lib/url';
	import type Player from 'video.js/dist/types/player';
	
	import VideoInfo from '../../components/VideoInfo.svelte';
	import VideoPlayer from '../../components/VideoPlayer.svelte';
	
	import Clip from '../../components/Clip.svelte';

	const url = new URL(window.location.href);
	const videoId = url.searchParams.get('id');
	if (!videoId) {
		window.location.href = '/';
		throw new Error('No video id provided');
	}
	const dataPromise = GetVideoInfo(videoId, { clips: true, detail: true });
	let player: Player | null = null;
</script>

<svelte:head>
	{#await dataPromise}
		<title>YTClip - Loading...</title>
	{:then data}
		<title>YTClip - {data.title}</title>
	{/await}
</svelte:head>

<div class="flex flex-col items-center">
	{#await dataPromise then data}
		<div class="text-lg font-semibold">{data.title}</div>
		{#if data.fileName}
			<VideoPlayer
				class="w-10/12"
				srcs={[{ src: getVideoURL(data.fileName), type: 'application/x-mpegURL' }]}
				bind:player
			/>
		{/if}
		<div class="text-lg font-semibold">既存クリップ {data.clips?.length}件</div>
		{#each data.clips?.sort((a, b) => a.start - b.start) ?? [] as clip, index}
			<Clip {clip} {index} {player} />
		{/each}
		<VideoInfo class="w-10/12" {data} />
	{/await}
</div>
