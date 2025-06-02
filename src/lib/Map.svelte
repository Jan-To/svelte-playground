<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { hexbin as d3Hexbin } from "d3-hexbin";

  // get Map image from https://www.mapchart.net/europe-detailed.html#
  // Isolate the map area and change background to transparent

  // Define the bounding box of map-image in lon/lat
  const mapBounds = {
    west: 5.8, // min longitude
    east: 15.1, // max longitude
    north: 55.0, // max latitude
    south: 47.12, // min latitude
  };

  const mapCenterCity = "Kaiserslautern";
  const mapRadius = 150000; // in meters

  const landmarkList = ["Kaiserslautern", "Saarbrücken", "Trier", "Mainz"];
  let landmarks = [];

  // Color scale
  const customColors = ["#F99D9D", "#D87C9A", "#AD769D", "#736B8D", "#275861"];

  function toMercator(lon, lat) {
    const R = 6378137;
    const x = (lon * Math.PI * R) / 180;
    const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
    return { x, y };
  }

  let geonames = [];
  let svgEl;
  let x, y, bins, farBins, mapCenter;

  onMount(async () => {
    const res = await fetch(base + "/DE.txt");
    const text = await res.text();
    geonames = text
      .split("\n")
      .filter((line) => line && !line.startsWith("//"))
      .map((line) => line.split("\t"))
      .filter((fields) => fields.length > 5)
      .map((fields) => ({
        name: fields[1],
        lat: parseFloat(fields[4]),
        lon: parseFloat(fields[5]),
      }));

    landmarks = landmarkList
      .map((name) => {
        const loc = geonames.find(
          (c) => c.name.toLowerCase() === name.toLowerCase(),
        );
        return {
          name: loc.name,
          lat: loc.lat,
          lon: loc.lon,
          x: toMercator(loc.lon, loc.lat).x,
          y: toMercator(loc.lon, loc.lat).y,
        };
      })
      .filter((loc) => loc !== undefined);
  });

  function projectToCircle(d, center, radius) {
    const dx = d.x - center.x;
    const dy = d.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) {
      // Avoid division by zero: place at (center.x + radius, center.y)
      return { x: center.x + radius, y: center.y };
    }
    const scale = radius / dist;
    return {
      x: center.x + dx * scale,
      y: center.y + dy * scale,
    };
  }

  export function draw(votes) {
    // setup svg
    if (!svgEl) return;
    d3.select(svgEl).selectAll("*").remove();
    const svg = d3.select(svgEl);
    const [, , width, height] = svg.attr("viewBox").split(" ").map(Number);
    const margin = { top: 19, right: 20, bottom: 20, left: 20 };

    // Get locations
    let locations = votes
      .map((vote) => vote.location)
      .filter(
        (loc) =>
          loc &&
          typeof loc.lon === "number" &&
          typeof loc.lat === "number" &&
          loc.name !== "" &&
          loc.lon != 0 &&
          loc.lat != 0,
      )
      .map((loc) => {
        const { x, y } = toMercator(loc.lon, loc.lat);
        return { ...loc, x, y };
      });

    // Define your map center and filter radius
    const mapCenterLoc = geonames.find(
      (c) => c.name.toLowerCase() === mapCenterCity.toLowerCase(),
    );
    const { x: centerX, y: centerY } = toMercator(
      mapCenterLoc.lon,
      mapCenterLoc.lat,
    );
    mapCenter = { x: centerX, y: centerY };
    const xDomain = [mapCenter.x - mapRadius, mapCenter.x + mapRadius];
    const yDomain = [mapCenter.y - mapRadius, mapCenter.y + mapRadius];

    // Scales
    x = d3
      .scaleLinear()
      .domain(xDomain)
      .range([margin.left, width - margin.right]);
    y = d3
      .scaleLinear()
      .domain(yDomain)
      .range([height - margin.bottom, margin.top]); // y axis flipped for SVG

    // Euklidean distance function
    function distance(a, b) {
      return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    // Prepare data: filter locations within mapRadius of mapCenter
    const closeLocations = locations.filter(
      (d) => distance(d, mapCenter) <= mapRadius,
    );
    const farLocations = locations.filter(
      (d) => distance(d, mapCenter) > mapRadius,
    );
    const projectedFarLocations = farLocations.map((d) =>
      projectToCircle(d, mapCenter, mapRadius),
    );

    const points = closeLocations.map((d) => [x(d.x), y(d.y)]);
    const farPoints = projectedFarLocations.map((d) => [x(d.x), y(d.y)]);

    // Hexbin generator
    const hexradius = 10;
    const hexbin = d3Hexbin()
      .x((d) => d[0])
      .y((d) => d[1])
      .radius(hexradius)
      .size([width, height]);

    bins = hexbin(points);

    const maxCount = d3.max(bins, (d) => d.length) || 1;
    const color = d3
      .scaleLinear()
      .domain([
        0,
        (maxCount * 1) / 4,
        (maxCount * 2) / 4,
        (maxCount * 3) / 4,
        maxCount,
      ])
      .range(customColors)
      .interpolate(d3.interpolateRgb);

    // Draw hexagons
    // svg
    //   .append("g")
    //   .attr("class", "hexagons")
    //   .selectAll("path")
    //   .data(bins)
    //   .join("path")
    //   .attr("d", hexbin.hexagon())
    //   .attr("transform", (d) => `translate(${d.x},${d.y})`)
    //   .attr("fill", (d) => color(d.length))
    //   .attr("stroke", "#fff")
    //   .attr("stroke-width", 0.2);

    // svg
    //   .append("g")
    //   .attr("class", "hexagons")
    //   .selectAll("path")
    //   .data(farBins)
    //   .join("path")
    //   .attr("d", farhexbin.hexagon())
    //   .attr("transform", (d) => `translate(${d.x},${d.y})`)
    //   .attr("fill", (d) => color(d.length))
    //   .attr("stroke", "black")
    //   .attr("stroke-width", 0.2);

    //Draw empty hexagons
    const allHexCenters = hexbin.centers();
    const occupied = new Set(bins.map((d) => `${d.x},${d.y}`));
    const mapCenterSVG = { x: x(mapCenter.x), y: y(mapCenter.y) };
    const emptyCenters = allHexCenters
      .map(([x, y]) => ({ x, y }))
      .filter((c) => !occupied.has(`${c.x},${c.y}`))
      .filter((c) => {
        // Compute SVG radius for mapRadius
        const svgRadius = Math.abs(x(mapCenter.x + mapRadius) - x(mapCenter.x));
        return distance(c, mapCenterSVG) <= svgRadius + hexradius * 0.8;
      });

    // Project the corners to Mercator
    const topLeft = toMercator(mapBounds.west, mapBounds.north);
    const bottomRight = toMercator(mapBounds.east, mapBounds.south);

    // Convert to SVG coordinates
    const svgTopLeft = { x: x(topLeft.x), y: y(topLeft.y) };
    const svgBottomRight = { x: x(bottomRight.x), y: y(bottomRight.y) };

    const extendFactor = 1.15;
    svg
      .append("g")
      .attr("class", "far-lines")
      .selectAll("line")
      .data(farPoints)
      .join("line")
      .attr("x1", (d) => d[0])
      .attr("y1", (d) => d[1])
      .attr("x2", (d) => {
        const cx = x(mapCenter.x);
        return cx + (d[0] - cx) * extendFactor;
      })
      .attr("y2", (d) => {
        const cy = y(mapCenter.y);
        return cy + (d[1] - cy) * extendFactor;
      })
      .attr("stroke", customColors[2])
      .attr("stroke-width", 3)
      .attr("opacity", 0.8)
      .attr("stroke-linecap", "round");

    const clippedmap = svg.append("g").attr("class", "clipped-map");

    // Draw blurred shadow circle behind the clipped map
    clippedmap
      .append("circle")
      .attr("cx", x(mapCenter.x))
      .attr("cy", y(mapCenter.y))
      .attr("r", x(mapCenter.x + mapRadius) - x(mapCenter.x))
      .attr("fill", "#888")
      .attr("opacity", 0.7)
      .style("filter", "blur(6px)");
    clippedmap
      .append("defs")
      .append("clipPath")
      .attr("id", "mapCircleClip")
      .append("circle")
      .attr("cx", x(mapCenter.x))
      .attr("cy", y(mapCenter.y))
      .attr("r", x(mapCenter.x + mapRadius) - x(mapCenter.x));
    clippedmap
      .append("image")
      .attr("xlink:href", base + "/GermanyMap_01_.png")
      .attr("class", "map-image")
      .attr("x", svgTopLeft.x)
      .attr("y", svgTopLeft.y)
      .attr("width", svgBottomRight.x - svgTopLeft.x)
      .attr("height", svgBottomRight.y - svgTopLeft.y)
      .attr("preserveAspectRatio", "none")
      .attr("clip-path", `url(#mapCircleClip)`);

    // svg
    //   .append("g")
    //   .attr("class", "empty-hexagons")
    //   .selectAll("circle")
    //   .data(emptyCenters)
    //   .join("circle")
    //   .attr("cx", (d) => d.x)
    //   .attr("cy", (d) => d.y)
    //   .attr("r", hexbin.radius() * 0.85)
    //   .attr("fill", customColors[0])
    //   .attr("stroke", "none")
    //   .attr("opacity", 0.8)
    //   .attr("clip-path", `url(#mapCircleClip)`);

    svg
      .append("g")
      .attr("class", "hexagons")
      .selectAll("circle")
      .data(bins)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", hexbin.radius() * 0.85) // or adjust as needed
      .attr("fill", (d) => color(d.length))
      .attr("color", (d) => color(d.length))
      .attr("stroke", "none")
      .attr("opacity", 0.8)
      .attr("clip-path", `url(#mapCircleClip)`);

    // Render landmarks
    svg
      .append("g")
      .attr("class", "landmarks")
      .selectAll("circle")
      .data(landmarks)
      .join("circle")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 2)
      .attr("fill", "black");
    svg
      .append("g")
      .attr("class", "landmarks")
      .selectAll("text")
      .data(landmarks)
      .join("text")
      .attr("x", (d) => x(d.x) + 4)
      .attr("y", (d) => y(d.y))
      .attr("font-size", 10)
      .attr("font-weight", "bold")
      .attr("stroke", "white")
      .attr("stroke-width", 1)
      .attr("paint-order", "stroke")
      .attr("fill", "black")
      .attr("text-anchor", "left")
      .attr("alignment-baseline", "central")
      .text((d) => d.name);

    // Optional debugging, draw points & circles
    // svg
    //   .append("g")
    //   .attr("class", "points")
    //   .selectAll("circle")
    //   .data(points)
    //   .join("circle")
    //   .attr("cx", (d) => d[0])
    //   .attr("cy", (d) => d[1])
    //   .attr("r", 2)
    //   .attr("fill", "red");

    // svg
    //   .append("g")
    //   .attr("class", "points")
    //   .selectAll("circle")
    //   .data(farPoints)
    //   .join("circle")
    //   .attr("cx", (d) => d[0])
    //   .attr("cy", (d) => d[1])
    //   .attr("r", 2)
    //   .attr("fill", "red");

    // svg
    //   .append("circle")
    //   .attr("cx", x(mapCenter.x))
    //   .attr("cy", y(mapCenter.y))
    //   .attr("r", x(mapCenter.x + mapRadius) - x(mapCenter.x))
    //   .attr("fill", "none")
    //   .attr("stroke", "black")
    //   .attr("opacity", 0.2);
  }

  export function update(votes, newVote) {
    if (!svgEl || !newVote) return;
    draw(votes);
    let vote = {};
    if (
      newVote.location &&
      typeof newVote.location.lon === "number" &&
      typeof newVote.location.lat === "number" &&
      newVote.location.name !== ""
    ) {
      const { x, y } = toMercator(newVote.location.lon, newVote.location.lat);
      vote.x = x;
      vote.y = y;
    }

    // Helper to find the bin containing newVote
    function findBin(bins, vote) {
      return bins.find((bin) =>
        bin.some(
          (d) =>
            Math.abs(d[0] - x(vote.x)) < 1e-2 &&
            Math.abs(d[1] - y(vote.y)) < 1e-2,
        ),
      );
    }
    const foundBin = findBin(bins, vote);
    if (foundBin) {
      // Select the corresponding circle and add the pulsate class
      d3.select(svgEl)
        .selectAll(".hexagons circle")
        .filter((d, i) => i === bins.indexOf(foundBin))
        .classed("pulsate", true);
    } else {
      // Find the far line whose endpoint is closest to the projected point
      const projected = projectToCircle(vote, mapCenter, mapRadius);
      const farLines = d3.select(svgEl).selectAll(".far-lines line");
      let minDist = Infinity,
        minNode = null;
      farLines.each(function () {
        const x2 = +this.getAttribute("x2");
        const y2 = +this.getAttribute("y2");
        const d = Math.hypot(x2 - x(projected.x), y2 - y(projected.y));
        if (d < minDist) {
          minDist = d;
          minNode = this;
        }
      });
      if (minNode) {
        d3.select(minNode).classed("pulsate", true).raise();
      }
    }
  }
</script>

<div class="vis-component">
  <h2>Where are you from?</h2>
  <svg bind:this={svgEl} viewBox="0 0 300 300"> </svg>
</div>

<style>
  svg {
    width: 100%;
    height: auto;
    background: none;
    /* background: #f8fafc; */
    /* border-radius: 0.5rem; */
    /* box-shadow: 0 2px 8px #0001; */
    margin: 0 auto;
  }

  :global(.pulsate) {
    animation: fill-pulse 1.2s ease-in-out infinite;
  }

  @keyframes fill-pulse {
    0% {
      filter: brightness(1.3) drop-shadow(0 0 0px #989898);
    }
    50% {
      filter: brightness(1) drop-shadow(0 0 2px #989898);
    }
    100% {
      filter: brightness(1.3) drop-shadow(0 0 0px #989898);
    }
  }
</style>
