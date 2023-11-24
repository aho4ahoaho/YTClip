<script lang="ts">
	import type { MouseElementEventHandler } from '$lib/type';

	export let color: 'primary' | 'secondary' | 'tertiary' | 'danger' = 'primary';
	let className = 'rounded border px-2 py-1';
	let _disabled = false;
	export { className as class, _disabled as disabled };
	export let onClick: MouseElementEventHandler<HTMLButtonElement> | undefined = undefined;
	export let type: 'button' | 'submit' | 'reset' = 'button';
</script>

<button
	class="{className} {_disabled ? 'disabled' : color}"
	on:click={(event) => {
		if (_disabled) return;
		onClick?.(event);
	}}
	{type}
>
	<slot />
</button>

<style lang="scss">
	button {
		@apply box-border rounded border px-2 py-1 transition-colors;
		&.disabled {
			@apply border-gray-400 bg-gray-400 text-gray-700;
		}
		&.primary {
			@apply border-sky-900 bg-sky-900 text-white;
			&:hover {
				@apply border-sky-800 bg-sky-800 text-slate-50;
			}
			&:active {
				@apply border-sky-700 bg-sky-700 text-slate-100;
			}
		}
		&.secondary {
			@apply border-black bg-white text-black;
			&:hover {
				@apply bg-slate-200;
			}
			&:active {
				@apply bg-slate-300;
			}
		}
		&.tertiary {
			@apply border-sky-900 bg-transparent text-sky-900;
			&:hover {
				@apply bg-sky-100;
			}
			&:active {
				@apply bg-sky-200;
			}
		}
		&.danger {
			@apply border-yellow-400 bg-yellow-400 font-bold text-black;
			&:hover {
				@apply border-yellow-500 bg-yellow-500;
			}
			&:active {
				@apply border-yellow-600 bg-yellow-600;
			}
		}
	}
</style>
