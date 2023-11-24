<script lang="ts">
	import { AddVideo,  GetVideoList, type ResponseVideo } from '$lib/api';
	
	import Button from '../components/Button.svelte';
	import InputText from '../components/InputText.svelte';
	
	import Card from '../components/Card.svelte';
	import { onMount } from 'svelte';

	let value = '';
	let data: ResponseVideo | null = null;
	let list: {
		videoId: string;
		title: string;
		thumbnail: string | null;
	}[] = [];
	const onLoad = () => {
		GetVideoList().then((res) => {
			list = res;
		});
	};
	onMount(onLoad);
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<div class="flex flex-col items-center">
	<div class="flex w-3/5 max-w-full items-center pt-2">
		<InputText
			class="w-64 flex-auto"
			bind:value
			placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
		/>
		<Button
			class="w-fit"
			onClick={async () => {
				const resData = await AddVideo(value);
				console.log(resData);
				if (typeof resData === 'string') {
					alert(resData);
					data = null;
				} else {
					value = '';
					data = resData;
					console.log(data);
					onLoad();
				}
			}}>Submit</Button
		>
	</div>
	<div class="flex max-w-full flex-wrap justify-center gap-x-4 gap-y-14">
		{#each list as v}
			<a
				href="/video?id={v.videoId}"
				class="rounded-md shadow-black transition-shadow hover:shadow-md"
			>
				<Card imgSrc={v.thumbnail ?? ''}>
					<p class="text text-ellipsis text-lg">{v.title}</p>
				</Card>
			</a>
		{/each}
	</div>
</div>
