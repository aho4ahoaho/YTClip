<script lang="ts">
	import type { MouseElementEvent } from '$lib/type';

	export let color: 'primary' | 'secondary' | 'tertiary' | 'danger' = 'primary';
	let className = 'rounded border px-2 py-1';
	export { className as class };
	export let onClick: MouseElementEvent<HTMLButtonElement> | undefined = undefined;
	export let type: 'button' | 'submit' | 'reset' = 'button';
</script>

<button class="{className} {color}" on:click={onClick} {type}>
	<slot />
</button>

<style lang="scss">
	button {
		@apply box-border rounded border px-2 py-1 transition-colors;
	}
	button.primary {
		@apply border-sky-900 bg-sky-900 text-white;
		&:hover {
			@apply border-sky-800 bg-sky-800 text-slate-50;
		}
		&:active {
			@apply border-sky-700 bg-sky-700 text-slate-100;
		}
	}

	button.secondary {
		@apply border-black bg-white text-black;
		&:hover {
			@apply bg-slate-200;
		}
		&:active {
			@apply bg-slate-300;
		}
	}

	button.tertiary {
		@apply border-sky-900 bg-transparent text-sky-900;
		&:hover {
			@apply bg-sky-100;
		}
		&:active {
			@apply bg-sky-200;
		}
	}

	button.danger {
		@apply border-yellow-400 bg-yellow-400 text-black;
		&:hover {
			@apply border-yellow-500 bg-yellow-500;
		}
		&:active {
			@apply border-yellow-600 bg-yellow-600;
		}
	}
</style>
