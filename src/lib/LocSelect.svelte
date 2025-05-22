<script>
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";
  import { base } from "$app/paths";

  let query = "";
  let geonames = [];
  let filteredLocs = [];
  let selectedLoc = null;
  let dropdownOpen = false;

  // Column indices from the readme:
  // 0: geonameid, 1: name, 4: latitude, 5: longitude
  onMount(async () => {
    const res = await fetch(base + "/DE.txt");
    const text = await res.text();
    geonames = text
      .split("\n")
      .filter((line) => line && !line.startsWith("//"))
      .map((line) => line.split("\t"))
      .filter((fields) => fields.length > 5 && fields[14] > 0)
      .map((fields) => ({
        name: fields[1],
        lat: parseFloat(fields[4]),
        lon: parseFloat(fields[5]),
        pop: parseFloat(fields[14]),
      }));
  });

  // Reactive filtering
  $: filteredLocs =
    query.length > 0
      ? geonames
          .filter((c) => c.name.toLowerCase().startsWith(query.toLowerCase()))
          .slice(0, 6)
      : [];

  function selectLoc(loc) {
    selectedLoc = loc;
    query = loc.name;
    filteredLocs = [];
    dropdownOpen = false;
  }

  function handleFocus() {
    if (filteredLocs.length > 0) dropdownOpen = true;
  }

  function handleBlur(event) {
    // Delay to allow click event to register before closing dropdown
    setTimeout(() => {
      dropdownOpen = false;
    }, 100);
  }

  export function getLocation() {
    if (selectedLoc) {
      return selectedLoc;
    } else if (query.length > 0) {
      const loc = geonames.find(
        (c) => c.name.toLowerCase() === query.toLowerCase(),
      );
      return loc || null;
    }
    return null;
  }
</script>

<div class="autocomplete-container">
  <input
    type="text"
    bind:value={query}
    placeholder="Enter a city"
    on:input={() => {
      selectedLoc = null;
      dropdownOpen = true;
    }}
    on:focus={handleFocus}
    on:blur={handleBlur}
    autocomplete="off"
  />

  {#if dropdownOpen && filteredLocs.length > 0 && filteredLocs[0].name !== query}
    <ul class="autocomplete-list input-options">
      {#each filteredLocs as loc}
        <li>
          <div
            role="option"
            tabindex="0"
            aria-selected={selectedLoc && selectedLoc.name === loc.name}
            on:mousedown={() => selectLoc(loc)}
            on:keydown={(e) =>
              (e.key === "Enter" || e.key === " ") && selectLoc(loc)}
          >
            {loc.name} ({loc.pop} population)
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .autocomplete-container {
    position: relative;
  }

  .autocomplete-list {
    overflow-y: auto;
    position: absolute;
    background: white;
    z-index: 10;
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  .autocomplete-list li {
    padding: 0.1em 0.9em;
    cursor: pointer;
  }
</style>
