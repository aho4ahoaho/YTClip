<script lang="ts">
	import { type ResponseVideo, client } from '$lib/api';
	import { getVideoURL, type Source } from '$lib/url';
	import type Player from 'video.js/dist/types/player';

	import VideoInfo from '../../components/VideoInfo.svelte';
	import VideoPlayer from '../../components/VideoPlayer.svelte';

	import Clip from '../../components/Clip.svelte';
	import Button from '../../components/Button.svelte';
	import { formatTimes } from '$lib/time';
	import InputTime from '../../components/InputTime.svelte';

	const url = new URL(window.location.href);
	const videoId = url.searchParams.get('id');
	if (!videoId) {
		window.location.href = '/';
		throw new Error('No video id provided');
	}
	let data: ResponseVideo | null = null;

	const refetch = () => {
		client.video.get[videoId]
			.get({
				$query: {
					clips: 'true',
					detail: 'true'
				}
			})
			.then((d) => {
				if (d.data && !('error' in d.data)) {
					data = {
						...d.data,
						id: d.data.id ?? 0,
						detail: d.data?.detail ?? undefined
					};
					return data;
				}
				if (d.data && 'error' in d.data) throw new Error(d.data.error);
				throw new Error(d.error?.message ?? 'Unknown error');
			})
			.then((data) => {
				const newSrc = getVideoURL(data.fileName);
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
	};
	refetch();

	let player: Player | null = null;

	let startTime: number | null = null;
	let endTime: number | null = null;

	let videoSources: Source[] = [];
</script>

<svelte:head>
	{#if data}
		<title>YTClip - {data.title}</title>
	{:else}
		<title>YTClip - Loading...</title>
	{/if}
</svelte:head>

<div class="flex flex-col items-center">
	<div class="text-lg font-semibold">{data?.title}</div>
	{#if videoSources.length > 0}
		<VideoPlayer class="w-10/12" srcs={videoSources} bind:player />
	{:else if data?.thumbnail}
		<button
			class="flex w-10/12 bg-black text-white transition-colors hover:bg-slate-700 hover:text-slate-200"
			on:click={async () => {
				await client.video.download.get({ $query: { videoId: videoId } });
				refetch();
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
		<div class="flex w-64 flex-col gap-2">
			<div class="flex w-full">
				<InputTime bind:value={startTime} class="h-8 w-2/3 text-center	" />
				<Button
					class="h-8 w-1/3"
					onClick={() => {
						startTime = player?.currentTime() ?? null;
					}}>開始ピン</Button
				>
			</div>
			<Button
				class="h-10 w-full"
				onClick={() => {
					if (startTime == null) return;
					player?.currentTime(startTime);
				}}>開始地点</Button
			>
		</div>
		<div>
			<Button
				class="h-20 w-64 py-4"
				disabled={endTime == null || startTime == null || endTime <= startTime}
				onClick={() => {
					if (startTime == null || endTime == null) return;
					client.clip.create[videoId]
						.post({ $query: { start: startTime, end: endTime } })
						.catch(console.error);
				}}>クリップ作成</Button
			>
		</div>
		<div class="flex w-64 flex-col gap-2">
			<div class="flex w-full">
				<InputTime bind:value={endTime} class="h-8 w-2/3 text-center" />
				<Button
					class="h-8 w-1/3"
					onClick={() => {
						endTime = player?.currentTime() ?? null;
					}}>終了ピン {endTime != null ? formatTimes(endTime, { digits: 1 }) : 'なし'}</Button
				>
			</div>
			<Button
				class="h-10 w-full"
				onClick={() => {
					if (endTime == null) return;
					player?.currentTime(endTime);
				}}>終了地点</Button
			>
		</div>
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
		{#each data?.clips?.sort((a, b) => a.start - b.start) ?? [] as clip}
			<Clip {clip} {player} videoId={data?.videoId} onDelete={refetch} />
		{/each}
		{#if data?.clips?.length === 0}
			<p class="text-lg">クリップがありません</p>
		{/if}
	</div>
	<VideoInfo class="w-10/12" {data} />
</div>
