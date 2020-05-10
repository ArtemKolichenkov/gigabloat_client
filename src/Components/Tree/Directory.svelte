<script>
  import Content from "./Content.svelte";
  export let dir;
  export let files;
  export let directories;

  let open = true;
  const collapse = () => {
    open = !open;
  };
</script>

<style>
  .caret {
    cursor: pointer;
    user-select: none;
  }

  .caret::before {
    content: "\25B6";
    color: black;
    display: inline-block;
    margin-right: 6px;
  }

  .caret-down::before {
    transform: rotate(90deg);
  }
</style>

<li>
  <span class="caret" class:caret-down={open} on:click={collapse}>{dir.name} ({dir.hrSize})</span>
  <Content {files} {directories} {open} />
</li>
