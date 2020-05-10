<script>
  import { hashRouter } from "./router";
  import Sidebar from "./Sidebar/Sidebar.svelte";
  import Scan from "./Views/Scan/Scan.svelte";
  import Settings from "./Views/Settings/Settings.svelte";
</script>

<style>
  .main-area {
    flex: 1;
    background-color: var(--theme-background100);
    color: var(--theme-text);
  }
</style>

<Sidebar currentRouteName={$hashRouter.name} />
<div class="main-area">
  <svelte:component this={$hashRouter.component} />
</div>
