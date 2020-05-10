<script>
  export let title;
  export let href;
  export let active = false;
  import piechart from "./Icons/piechart.svg";
  import filter from "./Icons/filter.svg";
  import copy from "./Icons/copy.svg";
  import layers from "./Icons/layers.svg";
  import settings from "./Icons/settings.svg";

  const getIcon = title => {
    switch (title) {
      case "Scan":
        return piechart;
        break;
      case "Filter":
        return filter;
        break;
      case "Find similar":
        return copy;
        break;
      case "Cleanup":
        return layers;
        break;
      case "Settings":
        return settings;
        break;
      default:
        break;
    }
  };
  const icon = getIcon(title);
</script>

<style>
  a {
    color: var(--theme-text);
    font-size: var(--font-normal);
  }

  a:hover {
    text-decoration: none;
  }

  li {
    display: flex;
    margin: 3px 0;
  }

  .main {
    display: inline-block;
    flex: 1;
    padding: 10px 0 10px 10px;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  .hoverable {
    transition: all 0.2s;
  }

  .hoverable:hover {
    color: var(--theme-accentPrimary);
    background-color: var(--theme-background100);
  }

  .active {
    cursor: default;
    background-color: var(--theme-background100);
  }

  .active-indicator {
    display: inline-block;
    min-width: 3px;
    background-color: var(--theme-text);
  }
</style>

<!-- substitute for router, disable active-->
<a {href}>
  <li>
    <div class="main" class:active class:hoverable={!active}>
      <!-- the svg loader plugin doesn't work -->
      <!-- https://github.com/codefeathers/rollup-plugin-svelte-svg/issues/7-->
      <icon width="20" />
      {title}
    </div>
    {#if active}
      <div class="active-indicator">&nbsp;</div>
    {/if}
  </li>
</a>
