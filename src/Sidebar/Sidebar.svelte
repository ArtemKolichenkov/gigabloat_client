<script>
  export let currentRouteName;
  import Menu from "./Menu.svelte";
</script>

<style>
  aside {
    flex: 1;
    padding-left: 25px;
    max-width: 250px;
    background-color: var(--theme-background200);
  }

  h1 {
    color: var(--theme-text);
    margin-top: 20px;
    font-size: var(--font-heading);
  }
</style>

<aside>
  <h1>File sorter</h1>
  <Menu {currentRouteName} />
</aside>
