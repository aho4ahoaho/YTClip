<script lang="ts">
	export let imgSrc: string = '';
	export let imgAlt: string = '';
	let className: string = '';
	export const videoId: string = '';

	export { className as class };
</script>

<div class="{className} card">
	<div class="img_container">
		<img loading="lazy" src={imgSrc} alt={imgAlt} />
	</div>
	<div class="text">
		<slot />
	</div>
</div>

<style lang="scss">
	div.card {
		@apply w-96 rounded-sm p-2;
	}
	div.img_container {
		@apply flex h-52 items-center justify-center bg-gray-200;
		img {
			@apply h-fit max-h-full w-fit max-w-full rounded-sm shadow-sm shadow-gray-800;
		}
	}
</style>
