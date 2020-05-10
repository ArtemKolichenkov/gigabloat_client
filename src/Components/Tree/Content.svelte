<script>
  import Directory from "./Directory.svelte";
  export let files;
  export let directories;
  export let open;
</script>

<style>
  ul {
    list-style-type: none;
  }

  .nested {
    display: none;
  }

  .active {
    display: block;
  }
</style>

<ul class="nested" class:active={open}>
  {#each files as file}
    <li>{file.filename} ({file.hrSize} {file.category})</li>
  {/each}
  {#if directories}
    {#each directories as dir}
      <Directory {dir} files={dir.files} directories={dir.subdirectories} />
    {/each}
  {/if}
</ul>
