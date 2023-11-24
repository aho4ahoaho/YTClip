<script lang="ts">
	import type { ResponseVideo } from '$lib/api';
	import { formatTimes } from '$lib/time';
	export let data: ResponseVideo | null = null;
	let className = '';
	export { className as class };
</script>

{#if data}
	<div class="{className} videoInfo">
		<table>
			{#if data.detail}
				<tr>
					<td> Title </td>
					<td>{data.title}</td>
				</tr>
				<tr>
					<td>Author</td>
					<td>{data.detail.author}</td>
				</tr>
				<tr>
					<td>Duration</td>
					<td>{formatTimes(data.detail.duration)}</td>
				</tr>
			{/if}
			<tr>
				<td>ID</td>
				<td>
					<a
						href={`https://www.youtube.com/watch?v=${data.videoId}`}
						target="_blank"
						rel="noopener noreferrer"
					>
						{data.videoId}
					</a>
				</td>
			</tr>
			<tr>
				<td>Status</td>
				<td>{data.processed}</td>
			</tr>
			{#if data.detail?.description}
				<!-- nullチェックではなく表示順大切にしたいだけ -->
				<tr>
					<td>Description</td>
					<td>{data.detail.description}</td>
				</tr>
			{/if}
		</table>
		<div class="img_container">
			<img loading="lazy" src={data.thumbnail} alt="thumbnail" />
		</div>
	</div>
{/if}

<style lang="scss">
	div.videoInfo {
		@apply flex flex-wrap items-center justify-center gap-4 px-4 py-2;
	}
	table {
		@apply border-collapse border border-gray-800;
		flex: 2;
		td {
			@apply whitespace-pre-wrap border border-gray-800;
		}
		td:nth-child(2) {
			@apply flex-1;
		}
	}
	div.img_container {
		@apply w-96 items-center justify-center;
		img {
			@apply h-fit w-fit;
		}
	}
</style>
