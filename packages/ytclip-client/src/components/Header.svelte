<script lang="ts">
	import { client } from '$lib/api';
	import Button from './Button.svelte';
	import InputText from './InputText.svelte';

	let url = '';
</script>

<header>
	<a class="home" href="/">
		<h1 class="text-xl">YTClip</h1>
	</a>
	<div class="w-0 flex-auto"></div>
	<form
		on:submit={(elm) => {
			elm.preventDefault();
			if (url.length > 0) {
				try {
					new URL(url);
				} catch {
					//IDのみの場合
					url = `https://youtu.be/${url}`;
				}
				client.video.add
					.get({ $query: { url } })
					.then(() => {
						if (location.pathname === '/') {
							location.reload();
						} else {
							url = '';
						}
					})
					.catch((err) => {
						console.error(err);
						elm.currentTarget.classList.add('border-red-500');
					});
			}
		}}
	>
		<InputText class="w-64 text-black" name="header_url" bind:value={url} />
		<Button color="secondary" type="submit">追加</Button>
	</form>
</header>

<style class="sass">
	header {
		@apply flex bg-black px-2 py-1 text-white;
	}
	a.home {
		transition: filter 0.2s;
		&:hover {
			filter: drop-shadow(0.25rem 0.25rem 0.5rem white);
		}
	}
</style>
