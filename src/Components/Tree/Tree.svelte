<script>
  import Directory from "./Directory.svelte";

  const subsub = [
    {
      name: "Super",
      files: ["RaspberryBomb", "LolKek"]
    },
    {
      name: "Duper",
      files: ["Bacon", "FrenchToast"]
    }
  ];
  const subdirectories = [
    {
      name: "Specials",
      files: ["Peach", "Unicorn"],
      subdirectories: subsub
    },
    {
      name: "Vegan",
      files: ["BananaVegan", "StrawberryVegan"]
    }
  ];
  export let rootDir = {
    name: "Milkshakes",
    files: ["Banana", "Chocolate"],
    subdirectories
  };
</script>

<style>
  /* Remove default bullets */
  ul,
  #root {
    list-style-type: none;
  }

  /* Remove margins and padding from the parent ul */
  #root {
    margin: 0;
    padding: 0;
  }
</style>

<ul id="root">
  <Directory
    dir={rootDir}
    files={rootDir.files}
    directories={rootDir.subdirectories} />
</ul>
