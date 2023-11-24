<script lang="ts">
	import { onMount } from 'svelte';
	import videojs from 'video.js';
	import type Player from 'video.js/dist/types/player';
	import 'video.js/dist/video-js.css';

	let className: string = '';
	export { className as class };

	let videoElm: HTMLVideoElement;
	export let srcs: { src: string; type: string }[] = [];
	export let player: Player | null = null;

	onMount(() => {
		player = videojs(videoElm, {
			autoplay: true,
			controls: true,
			fluid: true
		});
		srcs.length > 0 && player.src(srcs);

		return () => {
			player?.dispose();
		};
	});
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<div class={className}>
	<video class="video-js" bind:this={videoElm}></video>
</div>
