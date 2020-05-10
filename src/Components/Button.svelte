<script>
  export let text;
  export let onclick;
  export let disabled = false;
</script>

<style>
button {
    border-radius: 5px;
    background-color: salmon;
    border-color: black;
}
</style>

<button on:click={onclick} disabled={disabled}>{text}</button>
