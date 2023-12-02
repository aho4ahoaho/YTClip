<script lang="ts">
	import { formatTimes } from '$lib/time';

	let className = '';
	export { className as class };
	export let value: number | null = 0;
	$: stringValue = value ? formatTimes(value, { hours: true, digits: 2 }) : '';
</script>

<input
	class={className}
	type="time"
	step="0.01"
	value={stringValue}
	on:change={(e) => {
		const [hours, minutes, seconds] = e.currentTarget.value.split(':').map((v) => parseFloat(v));

		//パースできた場合のみ値を更新
		if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
			value = hours * 3600 + minutes * 60 + seconds;
		}
	}}
/>
