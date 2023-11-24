<script lang="ts">
	import { AddVideo } from '$lib/api';
	import Button from './Button.svelte';
	import InputText from './InputText.svelte';

	let url = '';
</script>

<header>
	<a href="/">
		<div class="text-xl">YTClip</div>
	</a>
	<div class="w-0 flex-auto"></div>
	<form
		on:submit={(elm) => {
			elm.preventDefault();
			console.log(elm, url);
			if (url.length > 0) {
				AddVideo(url).catch((err) => {
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
</style>
