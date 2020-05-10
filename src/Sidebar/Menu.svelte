<script>
  export let currentRouteName;
  import MenuItem from "./MenuItem.svelte";
</script>

<style>
  ul {
    padding: 0;
    list-style-type: none;
  }
</style>

<nav>
  <ul>
    <MenuItem title="Scan" href="#scan" active={currentRouteName === 'scan'} />
    <MenuItem title="Filter" href="#filter" active={currentRouteName === 'filter'}/>
    <MenuItem title="Find similar" href="#findsimilar" active={currentRouteName === 'findsimilar'}/>
    <MenuItem title="Cleanup" href="#cleanup" active={currentRouteName === 'cleanup'}/>
    <MenuItem title="Settings" href="#settings" active={currentRouteName === 'settings'}/>
  </ul>
</nav>
