<script lang="ts">
	import { ClipAPI, VideoAPI, type ResponseVideo } from '$lib/api';
	import { getVideoURL, type Source } from '$lib/url';
	import type Player from 'video.js/dist/types/player';

	import VideoInfo from '../../components/VideoInfo.svelte';
	import VideoPlayer from '../../components/VideoPlayer.svelte';

	import Clip from '../../components/Clip.svelte';
	import Button from '../../components/Button.svelte';
	import { formatTimes } from '$lib/time';

	const url = new URL(window.location.href);
	const videoId = url.searchParams.get('id');
	if (!videoId) {
		window.location.href = '/';
		throw new Error('No video id provided');
	}
	let dataPromise = VideoAPI.GetVideoInfo(videoId, { clips: true, detail: true });
	let data: ResponseVideo | null = null;

	let player: Player | null = null;

	let startTime: number | null = null;
	let endTime: number | null = null;

	let videoSources: Source[] = [];
	$: dataPromise.then((d) => {
		data = d;
		const newSrc = getVideoURL(d.fileName);
		if (videoSources.length !== newSrc.length) {
			videoSources = newSrc;
		} else {
			let flag = false;
			for (let i = 0; i < videoSources.length; i++) {
				if (videoSources[i].src !== newSrc[i].src) {
					flag = true;
					break;
				}
			}
			if (flag) {
				videoSources = newSrc;
			}
		}
	});
</script>

<svelte:head>
	{#await dataPromise}
		<title>YTClip - Loading...</title>
	{:then data}
		<title>YTClip - {data.title}</title>
	{/await}
</svelte:head>

<div class="flex flex-col items-center">
	<div class="text-lg font-semibold">{data?.title}</div>
	{#if videoSources.length > 0}
		<VideoPlayer class="w-10/12" srcs={videoSources} bind:player />
	{:else if data?.thumbnail}
		<button
			class="flex w-10/12 bg-black text-white transition-colors hover:bg-slate-700 hover:text-slate-200"
			on:click={() => {
				VideoAPI.SaveVideo(videoId)
					.then(() => {
						dataPromise = VideoAPI.GetVideoInfo(videoId, { clips: true, detail: true });
					})
					.catch(console.error);
			}}
		>
			<img class="w-full opacity-30" src={data.thumbnail} alt="thumbnail" />
			<div class=" absolute flex h-2/3 w-10/12 items-center justify-center text-6xl font-bold">
				{#if data.processed === 'Processing'}
					保存中...
				{:else}
					保存する
				{/if}
			</div>
		</button>
	{/if}
	<div class="text-lg font-semibold">新規クリップ</div>
	<div class="mb-2 flex items-center gap-4">
		<Button
			class="h-12 w-64"
			onClick={() => {
				startTime = player?.currentTime() ?? null;
			}}>開始ピン {startTime != null ? formatTimes(startTime, 1) : 'なし'}</Button
		>
		<Button
			class="h-12 w-64"
			disabled={endTime == null || startTime == null}
			onClick={() => {
				if (startTime == null || endTime == null) return;
				ClipAPI.CreateClip(videoId, startTime, endTime)
					.then(() => {
						dataPromise = VideoAPI.GetVideoInfo(videoId, { clips: true, detail: true });
					})
					.catch(console.error);
			}}>クリップ作成</Button
		>

		<Button
			class="h-12 w-64"
			onClick={() => {
				endTime = player?.currentTime() ?? null;
			}}>終了ピン {endTime != null ? formatTimes(endTime, 1) : 'なし'}</Button
		>
	</div>
	<div></div>
	<div class="text-lg font-semibold">既存クリップ {data?.clips?.length}件</div>
	<div class="flex w-full flex-col items-center justify-center text-center">
		<div class="flex gap-4">
			<p class="w-24">開始時間</p>
			<p class="w-24">終了時間</p>
			<p class="ml-2 w-24">アクション</p>
			<p class="w-24">長さ</p>
			<p class="w-24">削除</p>
		</div>
		{#each data?.clips?.sort((a, b) => a.start - b.start) ?? [] as clip, index}
			<Clip
				{clip}
				{player}
				videoId={data?.videoId}
				onDelete={() => {
					dataPromise = VideoAPI.GetVideoInfo(videoId, { clips: true, detail: true });
				}}
			/>
		{/each}
		{#if data?.clips?.length === 0}
			<p class="text-lg">クリップがありません</p>
		{/if}
	</div>
	<VideoInfo class="w-10/12" {data} />
</div>
