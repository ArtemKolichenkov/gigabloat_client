<script>
  import { setContext, onMount } from "svelte";
  import { writable } from "svelte/store";
  import { themes as _themes } from "./themes.js";
  import { fonts } from "./fonts.js";

  export let themes = [..._themes];

  let _current = themes[1].name;

  const getCurrentTheme = name => themes.find(t => t.name === name);

  const Theme = writable(getCurrentTheme(_current));
  setContext("theme", {
    theme: Theme,
    toggle: () => {
      const newThemeIndex = _current === "light" ? 1 : 0;
      _current = themes[newThemeIndex].name;
      Theme.update(t => ({ ...t, ...getCurrentTheme(_current) }));
      setRootColors(getCurrentTheme(_current));
    }
  });

  onMount(() => {
    setRootColors(getCurrentTheme(_current));
    setFonts();
  });

  const setRootColors = theme => {
    for (let [prop, color] of Object.entries(theme.colors)) {
      let varString = `--theme-${prop}`;
      document.documentElement.style.setProperty(varString, color);
    }
    document.documentElement.style.setProperty("--theme-name", theme.name);
  };
  const setFonts = () => {
    for (let [prop, font] of Object.entries(fonts)) {
      let varString = `--font-${prop}`;
      document.documentElement.style.setProperty(varString, font);
    }
  };
</script>

<slot />
