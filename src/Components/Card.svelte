<script>
  import { slide } from "svelte/transition";
  export let title;
  import Heading from "./Heading.svelte";
  let expanded = true;
  const collapseCard = () => {
    expanded = !expanded;
  };
</script>

<style>
  .card-container {
    padding: 10px;
    margin: 10px;
    border-radius: 10px;
    background-color: var(--theme-background300);
  }
  .card-heading {
    display: flex;
    justify-content: space-between;
  }

  .content {
    padding-top: 10px;
  }

  button {
    border: 1.5px solid var(--theme-headingText);
    color: var(--theme-headingText);
    background-color: var(--theme-background300);
    border-radius: 15px;
    width: 24px;
    height: 24px;
    padding: 0;
    margin: 0;
    text-align: center;
    line-height: 22px;
    font-size: 14px;
  }
</style>

<div class="card-container">
  <div class="card-heading">
    <Heading {title} />
    <button on:click={collapseCard}>{expanded ? '-' : '▼'}</button>
  </div>
  {#if expanded}
    <div transition:slide|local={{ duration: 200 }} class="content">
      <slot />
    </div>
  {/if}
</div>
