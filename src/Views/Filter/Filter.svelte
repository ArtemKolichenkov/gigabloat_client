<script>
  const { dialog } = require("electron").remote;
  import Card from "../../Components/Card.svelte";
  import Button from "../../Components/Button.svelte";
  import Tree from "../../Components/Tree/Tree.svelte";
  import { scanDirectory, getRoot } from "../../grpc_client";
  import { summary, rootData } from "../../grpc_store.js";

  let target = "/Users/artem/Pictures/CVPhotos";
  let rootSubdirs = $rootData ? $rootData.subdirectories : [];
  const getStats = () => {
    console.log("getstats");
    scanDirectory(target);
  };

  const getRootTree = () => {
    getRoot(target);
  };

  const chooseTarget = async () => {
    target = dialog.showOpenDialogSync({
      properties: ["openDirectory", "showHiddenFiles"]
    });
  };
</script>

<style>
  pre {
    background-color: var(--theme-background200);
    padding: 10px;
    border-radius: 5px;
  }

  .card_columns {
    display: flex;
  }

  .card_column {
    flex: 1;
    padding: 5px;
  }

  .card_column:first-child {
    border-right: 1px solid salmon;
  }
</style>

<Card title="Debugger | Scan">
  <div class="card_columns">
    <div class="card_column">
      <Button onclick={chooseTarget} text={'Choose directory'} />
      <h4>Target: {target || 'Not chosen'}</h4>
      <Button
        onclick={getStats}
        text={'Get basic stats'}
        disabled={target === undefined} />
      <pre>{JSON.stringify($summary, null, 2)}</pre>
    </div>
    <div class="card_column">
      <Button
        onclick={getRootTree}
        text={'Get root tree'}
        disabled={target === undefined} />
      {#if $rootData}
        <Tree rootDir={$rootData} />
      {/if}
    </div>
  </div>
</Card>
