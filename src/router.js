import { readable } from "svelte/store";

import Scan from "./Views/Scan/Scan.svelte";
import Filter from "./Views/Filter/Filter.svelte";
import Settings from "./Views/Settings/Settings.svelte";
import PageNotFound from "./Views/PageNotFound/PageNotFound.svelte";

const routes = {
  'scan': Scan,
  'filter': Filter,
  'settings': Settings,
}


// --- START HASH ROUTER
const getHash = () => {
  const name = window.location.hash.replace(/^#\/?|\/$/g, "").split("/")[0];
  const component = routes[name];
  return {
    "name": window.location.hash.replace(/^#\/?|\/$/g, "").split("/")[0],
    "component": component || PageNotFound,
  }
}
const initialRoute = {
  "name": "filter",
  "component": Filter,
}
export const hashRouter = readable(initialRoute, set => {
  window.onhashchange = () => set(getHash());
});
// --- END HASH ROUTER
