<script lang="ts">
	import { client } from '$lib/api';

	import Button from '../components/Button.svelte';
	import InputText from '../components/InputText.svelte';

	import Card from '../components/Card.svelte';
	import { onMount } from 'svelte';

	let value = '';
	let list: {
		videoId: string;
		title: string;
		thumbnail: string | null;
	}[] = [];
	const onLoad = () => {
		client.video.list.get().then((res) => {
			if ('data' in res && res.data != null) {
				list = res.data;
			} else {
				alert(res.error);
			}
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
				const data = client.video.add.get({ $query: { url: value } });
				if ('error' in data) {
					alert(data.error);
				} else {
					value = '';
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
