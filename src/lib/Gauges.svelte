<script>
  import Gauge from "$lib/Gauge.svelte";
  import { onMount } from "svelte";

  let gauges = [
    {
      label: "Coffee",
      color: "#94550b",
      waveTextColor: "#F3F3F3",
      value: 50,
      ref: null,
    },
    {
      label: "Tea",
      color: "#B7CF9F",
      waveOffset: 0.5,
      waveAnimateTime: 1700,
      value: 30,
      ref: null,
    },
    {
      label: "Water",
      color: "#74ccf4",
      value: 20,
      ref: null,
    },
    {
      label: "Juice",
      color: "#f9e055",
      waveOffset: 0.5,
      waveAnimateTime: 1700,
      value: 10,
      ref: null,
    },
  ];

  function defaultConfig() {
    return {
      minValue: 0,
      maxValue: 100,
      circleThickness: 0.05,
      circleFillGap: 0.05,
      circleColor: "#e4e4e4",
      waveHeight: 0.05,
      waveCount: 1,
      waveRiseTime: 3000,
      waveAnimateTime: 1500,
      waveRise: true,
      waveHeightScaling: true,
      waveAnimate: true,
      waveColor: "#178BCA",
      waveOffset: 0.25,
      textVertPosition: 0.8,
      textSize: 0.7,
      valueCountUp: true,
      displayPercent: true,
      textColor: "#333",
      waveTextColor: "#333333",
      labelTextSize: 0.6,
      label: "Label",
      value: 0,
    };
  }

  function getGaugeConfig(gauge) {
    const config = defaultConfig();
    if (gauge.color) config.waveColor = gauge.color;
    if (gauge.waveTextColor) config.waveTextColor = gauge.waveTextColor;
    if (gauge.waveOffset) config.waveOffset = gauge.waveOffset;
    if (gauge.waveAnimateTime) config.waveAnimateTime = gauge.waveAnimateTime;
    if (gauge.value) config.value = gauge.value;
    if (gauge.label) config.label = gauge.label;
    return config;
  }

  function getDrinkPercentages(currentVotes) {
    const drinkCounts = {};
    currentVotes.forEach((vote) => {
      vote.drinks.forEach((drink) => {
        drinkCounts[drink] = (drinkCounts[drink] || 0) + 1;
      });
    });
    Object.keys(drinkCounts).forEach((drink) => {
      drinkCounts[drink] = Math.round(
        (drinkCounts[drink] / currentVotes.length) * 100,
      );
    });
    return drinkCounts;
  }

  function setDrinkPercentages(newPercentages) {
    // TODO check if the order matches
    gauges.forEach((gauge) => {
      const drink = gauge.label;
      if (newPercentages[drink]) {
        gauge.value = newPercentages[drink];
      } else {
        gauge.value = 0;
      }
    });
  }

  export function draw(currentVotes) {
    const percentages = getDrinkPercentages(currentVotes);
    setDrinkPercentages(percentages);

    // Redraw the gauges with the new values
    gauges.forEach((gauge) => {
      if (gauge.ref) gauge.ref.draw(gauge.value);
    });
  }

  export function update(currentVotes, newestVote) {
    const percentages = getDrinkPercentages(currentVotes);
    setDrinkPercentages(percentages);

    // Redraw the gauges with the new values
    gauges.forEach((gauge) => {
      const drip = newestVote.drinks && newestVote.drinks.includes(gauge.label);
      if (gauge.ref) gauge.ref.update(gauge.value, drip);
    });
  }
</script>

<div class="vis-component">
  <h2>What do you drink?</h2>
  <div class="gauges">
    {#each gauges as gauge, i}
      <!-- svelte-ignore binding_property_non_reactive -->
      <Gauge bind:this={gauge.ref} config={getGaugeConfig(gauge)} />
    {/each}
  </div>
</div>

<style>
  .gauges {
    display: grid;
    grid-template-columns: 1fr 1fr;
    justify-items: center;
    align-items: center;
  }
</style>
