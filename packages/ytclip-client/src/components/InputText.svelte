<script lang="ts">
	let className: string = '';
	export let name: string | null = null;
	export let value: string = '';
	export let placeholder: string = '';
	export { className as class };
</script>

<input class={className} type="text" {name} bind:value {placeholder} />

<style>
	input {
		@apply box-border rounded border border-slate-700 px-2 py-1 transition-colors;
	}
</style>
