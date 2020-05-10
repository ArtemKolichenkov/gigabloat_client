<script>
  import { getContext } from 'svelte'
  const { theme, toggle } = getContext('theme')
</script>

<!-- Not used yet-->
<span>Theme:</span><button on:click={toggle}>{$theme.name}</button>

<style>
button {
  border-radius: 15px;
  padding: 5px 15px;
  background-color: var(--theme-text);
  color: var(--theme-background100);
}

span {
  color: var(--theme-text);
  margin-right: 10px;
}
</style>