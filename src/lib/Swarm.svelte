<script>
  import * as d3 from "d3";
  import { base } from "$app/paths";
  import { scaleTime } from "d3-scale";
  import { axisBottom } from "d3-axis";
  import { nonpassive } from "svelte/legacy";
  import { onMount, onDestroy } from "svelte";

  let svgRef, svgAxRef, containerRef, width, height;
  let data = [];
  const marginTop = 0;
  const marginRight = 30;
  const marginBottom = 23;
  const marginLeft = 30;
  const padding = 1;
  let radius = 18;
  const time = 60;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dez",
  ];
  let currentIndex = 6;
  let currentMonth = months[currentIndex];
  // Change the string every second
  const interval = setInterval(
    () => {
      currentIndex = (currentIndex + 1) % months.length;
      currentMonth = months[currentIndex];
    },
    (time * 1000) / 12,
  );
  // Cleanup on unmount
  onDestroy(() => clearInterval(interval));

  onMount(() => {
    containerRef?.style.setProperty("--time", time);
  });

  function dodge(data, { radius = 1, x = (d) => d } = {}) {
    const radius2 = radius ** 2;
    const circles = data
      .map((d, i, data) => ({ x: +x(d, i, data), data: d }))
      .sort((a, b) => a.x - b.x);
    const epsilon = 1e-3;
    let head = null,
      tail = null;

    // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
    function intersects(x, y) {
      let a = head;
      while (a) {
        if (radius2 - epsilon > (a.x - x) ** 2 + (a.y - y) ** 2) {
          return true;
        }
        a = a.next;
      }
      return false;
    }

    // Place each circle sequentially.
    for (const b of circles) {
      // Remove circles from the queue that can’t intersect the new circle b.
      while (head && head.x < b.x - radius2) head = head.next;

      // Choose the minimum non-intersecting tangent.
      if (intersects(b.x, (b.y = 0))) {
        let a = head;
        b.y = Infinity;
        do {
          let y = a.y + Math.sqrt(radius2 - (a.x - b.x) ** 2);
          if (y < b.y && !intersects(b.x, y)) b.y = y;
          a = a.next;
        } while (a);
      }

      // Add b to the queue.
      b.next = null;
      if (head === null) head = tail = b;
      else tail = tail.next = b;
    }
    const max_y = circles
      .filter((c) => c.y)
      .reduce((p, c) => (p.y > c.y ? p.y : c.y));

    return [circles, max_y];
  }

  const getBreakfastEmoji = (breakfast) => {
    switch (breakfast) {
      case "Bread":
        return "🥪";
      case "Cereal":
        return "🍩";
      case "Nothing":
        return "🚫";
      default:
        return "";
    }
  };

  export function draw(currentVotes) {
    const votes = currentVotes.map((d) => ({
      getuptime: new Date(d.getuptime.seconds * 1000),
      breakfast: d.breakfast,
      breakfastEmoji: getBreakfastEmoji(d.breakfast),
    }));

    const svg = d3.select(svgRef);
    [, , width, height] = svg.attr("viewBox").split(" ").map(Number);

    const timeScale = scaleTime()
      .domain([new Date(2025, 0, 1, 5, 30), new Date(2025, 0, 1, 9, 0)])
      .range([marginLeft, width - marginRight]);

    d3.select(svgAxRef)
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(timeScale).tickFormat(d3.timeFormat("%-I:%M")));

    let temp_data = [null, 10000];
    while (temp_data[1] > height - marginTop - marginBottom - 2 * radius) {
      radius *= 0.95;
      temp_data = dodge(votes, {
        radius: radius * 2 + padding,
        x: (d) => timeScale(d.getuptime),
      });
      console.log(temp_data[1]);
    }
    data = temp_data[0];
  }
</script>

<div class="vis-component double">
  <h2>How did you get up today?</h2>
  <div bind:this={containerRef} class="container">
    <div class="background sky"></div>
    <div class="background ground"></div>
    <svg bind:this={svgRef} viewBox="0 0 600 150">
      <path
        id="moonPath"
        d="M11 154C27 74 76 21 150 11 75 21 27 74 11 154"
        fill="none"
      />
      <image href={base + "/moon.png"} width="35" height="35">
        <animateMotion
          dur="{time}s"
          repeatCount="indefinite"
          rotate="90deg"
          keyPoints="0;0;0.5;0.5;1;1"
          keyTimes="0;0.1;0.45;0.55;0.9;1"
        >
          <mpath href="#moonPath" />
        </animateMotion>
      </image>
      <path
        id="sunPath"
        d="M421 11c78 7 124 58 143 139C545 69 499 18 421 11"
        fill="none"
      />
      <image href={base + "/sun.png"} width="40" height="40">
        <animateMotion
          dur="{time}s"
          repeatCount="indefinite"
          rotate="90deg"
          keyPoints="0;0;0.5;0.5;1;1"
          keyTimes="0;0.05;0.45;0.55;0.95;1"
        >
          <mpath href="#sunPath" />
        </animateMotion>
      </image>
      <g>
        {#each data as d}
          <text
            class="breakfast"
            x={d.x}
            y={height - marginBottom - radius - padding - d.y}
            font-size={1.9 * radius}>{d.data.breakfastEmoji}</text
          >
        {/each}
      </g>
    </svg>
    <svg bind:this={svgAxRef} viewBox="0 0 600 150" class="axSVG">
      <text x="580" y="19" font-size="13" text-anchor="middle"
        >{currentMonth}</text
      >
    </svg>
  </div>
</div>

<style>
  svg {
    position: relative;
    z-index: 10;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .axSVG {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
  }
  :global(.axis path),
  :global(.axis line) {
    display: none;
  }
  .breakfast {
    text-anchor: middle;
    dominant-baseline: central;
    fill: black;
  }
  .container {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .background {
    position: absolute;
    width: 200%;
    animation: slide calc(var(--time) * 1s) cubic-bezier(0.2, 0, 0.8, 1)
      infinite;
  }
  .sky {
    height: 100%;
    z-index: 0;
    background: linear-gradient(
      to right,
      #1f2d60 0%,
      #1f2d60 48%,
      #448ff7 52%,
      #90e0ef 100%
    );
  }
  .ground {
    height: 15%;
    top: 85%;
    z-index: 2;
    background: linear-gradient(
      to right,
      #465d32 0%,
      #465d32 48%,
      #64953a 52%,
      #64953a 100%
    );
  }

  @keyframes slide {
    0%,
    100% {
      transform: translateX(-47%);
    }
    50% {
      transform: translateX(-9%);
    }
  }
</style>
