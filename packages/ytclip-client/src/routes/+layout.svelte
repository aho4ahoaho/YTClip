<script>
	import './colors.css';
	import './styles.css';
	import '../app.css';
	import Header from '../components/Header.svelte';
</script>

<div class="app">
	<Header />
	<main>
		<slot />
	</main>
</div>
