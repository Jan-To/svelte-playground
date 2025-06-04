<script>
  import * as d3 from "d3";
  import { base } from "$app/paths";
  import { t } from "$lib/i18n.js";

  // wizard source: <a href="https://www.flaticon.com/free-icons/wizard" title="wizard icons">Wizard icons created by Freepik - Flaticon</a>
  // hero source: <a href="https://www.flaticon.com/free-icons/superhero" title="superhero icons">Superhero icons created by Freepik - Flaticon</a>

  let currentVotes = [],
    svgRef,
    width = 600,
    height = 300;
  const numBalls = 50;

  let [sideCountA, sideCountB] = getSideCount();
  let balls = [];
  let simulation = null;
  let ticks = 0;
  const seesaw = {
    centerY: 250,
    slope: 0,
    vs: 0,
    height: 14,
    maxAngle: 0.1,
    speed: 0.00001,
  };
  const seats = {
    length: 50,
  };
  const divider = {
    r: 30,
  };

  const colorA = "#ffd4d4",
    colorB = "#cdddf7";
  const cornerRadius = 12;
  const iconSize = 35;
  const iconY = 40;
  const textSpacing = 8;
  const textSize = 35;

  function getEmojis() {
    // Get emojis from the current votes
    const map = new Map();
    currentVotes.forEach((d) => {
      const key = `${d.emoji}_${d.idol}`;
      if (!map.has(key)) {
        map.set(key, {
          emoji: d.emoji,
          group: d.idol === "Wizard" ? 1 : 0,
          count: 1,
        });
      } else {
        map.get(key).count += 1;
      }
    });
    return Array.from(map.values());

    // Simulate biased emoji data
    const possibleEmojis = Array.from(
      { length: 0x1f64f - 0x1f600 + 1 },
      (_, i) => String.fromCodePoint(0x1f600 + i),
    );
    const emojis = d3.range(numBalls).map(() => ({
      emoji: possibleEmojis[Math.floor(Math.random() * possibleEmojis.length)], // Random emoji
      count: Math.floor(Math.random() ** 4 * 10) + 1, // Random count
      group: Math.round(Math.random()), // Random group (0 or 1)
    }));
    return emojis;
  }

  function getMinRadius(allCounts) {
    const totalArea = width * height * 0.1;
    const scalingFactor = (allCounts / 30) ** (1 / 5);
    const minRadius =
      Math.sqrt(totalArea / (Math.PI * allCounts)) * scalingFactor;
    return minRadius;
  }
  function createBall(e, minRadius) {
    return {
      emoji: e.emoji,
      count: e.count,
      r: Math.sqrt(e.count * minRadius * minRadius),
      side: e.group,
      x:
        width / 2 +
        (width / 4) * Math.sign(e.group - 0.5) +
        ((Math.random() - 0.5) * width) / 3,
      y: (Math.random() * height) / 2 - height / 2,
      vx: 0,
      vy: 0,
    };
  }

  function addCollision(dampeningFactor, objectSpacing) {
    simulation.force("seesaw", () => {
      balls.forEach((d) => {
        // Hit detection with the seesaw board
        const seesawY =
          seesaw.slope * d.x + seesaw.intercept - 2 * objectSpacing;
        if (d.y + d.r > seesawY && d.x > seesaw.x1 && d.x < seesaw.x2) {
          d.y = seesawY - d.r + 1;
          d.vy *= -dampeningFactor;
          // add gravity effect on the seesaw
          d.vx += seesaw.slope * 0.1;
        }
      });
    });

    simulation.force("seatCollision", () => {
      balls.forEach((d) => {
        // Check collision with left seat
        const seatXLeft =
          (d.y - seats.ly) / seats.slope + seats.lx + 2 * objectSpacing;
        // hit top of seat
        if (d.x - d.r < seatXLeft && d.y < seats.ly && d.y > seats.ly - d.r) {
          d.y = seats.ly - d.r;
          d.vy *= -dampeningFactor;
          d.vx += 0.1;
        }
        // hit side of seat
        if (d.x - d.r < seatXLeft && d.y > seats.ly && d.y < seesaw.y1) {
          d.x = seatXLeft + d.r;
          d.vx *= -dampeningFactor;
        }

        // Check collision with right seat
        const seatXRight =
          (d.y - seats.ry) / seats.slope + seats.rx - 2 * objectSpacing;
        // hit top of seat
        if (d.x + d.r > seatXRight && d.y < seats.ry && d.y > seats.ry - d.r) {
          d.y = seats.ry - d.r;
          d.vy *= -dampeningFactor;
          d.vx -= 0.1;
        }
        // hit side of seat
        if (d.x + d.r > seatXRight && d.y > seats.ry && d.y < seesaw.y2) {
          d.x = seatXRight - d.r;
          d.vx *= -dampeningFactor;
        }
      });
    });

    simulation.force("divider", () => {
      balls.forEach((d) => {
        const dx = d.x - divider.x;
        const dy = d.y - divider.y;
        const distance = Math.sqrt(dx * dx + dy * dy) - objectSpacing;

        if (distance < d.r + divider.r) {
          // Ball is within the divider's radius
          const angle = Math.atan2(dy, dx); // Angle of contact point
          const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy) * dampeningFactor; // Preserve speed

          // Update velocity to reflect the angle of the contact point
          d.vx = speed * Math.cos(angle);
          d.vy = speed * Math.sin(angle);

          // Push the ball out of the divider to prevent overlap
          const overlap = d.r + divider.r - distance;
          d.x += Math.cos(angle) * overlap;
          d.y += Math.sin(angle) * overlap;
        }
      });
    });

    simulation.force("walls", () => {
      balls.forEach((d) => {
        // Check collision with left and right walls
        if (d.x - d.r < 0) {
          d.x = d.r;
          d.vx *= -dampeningFactor;
        } else if (d.x + d.r > width) {
          d.x = width - d.r;
          d.vx *= -dampeningFactor;
        }

        // Check collision with top and bottom walls
        // if (d.y - d.r < 0) {
        //   d.y = d.r;
        //   d.vy *= -dampeningFactor;
        // } else
        if (d.y + d.r > height) {
          d.y = height - d.r;
          d.vy *= -dampeningFactor;
        }
      });

      simulation.force("middlesplit", () => {
        const middle = width / 2;
        balls.forEach((d) => {
          // Check collision middle wall
          if (d.x < middle && d.x + d.r > middle) {
            d.x = d.x - 0.1 * d.r;
            d.vx *= -dampeningFactor;
          } else if (d.x > middle && d.x - d.r < middle) {
            d.x = d.x + 0.1 * d.r;
            d.vx *= -dampeningFactor;
          }
        });
      });
    });
  }

  function updateSeesaw() {
    updateSeesawAngle();

    seesaw.length = width * 0.94;
    seesaw.centerX = width / 2;
    divider.x = seesaw.centerX;
    divider.y = seesaw.centerY + seesaw.height / 2;

    const halfLength = seesaw.length / 2;
    const dx = halfLength / Math.sqrt(1 + seesaw.slope ** 2);
    const dy = seesaw.slope * dx;

    seesaw.x1 = seesaw.centerX - dx;
    seesaw.y1 = seesaw.centerY - dy;
    seesaw.x2 = seesaw.centerX + dx;
    seesaw.y2 = seesaw.centerY + dy;
    seesaw.intercept = seesaw.y1 - seesaw.slope * seesaw.x1;
    seesaw.angle =
      (Math.atan2(seesaw.y2 - seesaw.y1, seesaw.x2 - seesaw.x1) * 180) /
      Math.PI; // Angle of the seesaw in degrees

    // adjust seats position
    if (Math.abs(seesaw.slope) > 0.0001) {
      seats.slope = -1 / seesaw.slope;
      seats.li = seesaw.x1 - seats.slope * seesaw.y1;
      seats.lx =
        seesaw.x1 +
        Math.sqrt(seats.length ** 2 / (1 + seats.slope ** 2)) *
          Math.sign(seesaw.slope);
      seats.ly = seesaw.y1 + seats.slope * (seats.lx - seesaw.x1);
      seats.rx =
        seesaw.x2 +
        Math.sqrt(seats.length ** 2 / (1 + seats.slope ** 2)) *
          Math.sign(seesaw.slope);
      seats.ry = seesaw.y2 + seats.slope * (seats.rx - seesaw.x2);
    } else {
      seats.slope = -Infinity;
      seats.lx = seesaw.x1;
      seats.ly = seesaw.y1 - seats.length;
      seats.rx = seesaw.x2;
      seats.ry = seesaw.y2 - seats.length;
    }
  }

  function getBallRatio() {
    let leftSlowBalls = 0;
    let rightSlowBalls = 0;
    balls.forEach((d) => {
      // Check if ball is low enough
      if (d.y > seesaw.centerY + 2 * seats.length) {
        return;
      }
      // Check if ball is slow
      const slowThreshold = 1;
      const velocity = Math.sqrt(d.vx ** 2 + d.vy ** 2);
      if (velocity < slowThreshold) {
        const weight = d.r * d.r * Math.PI;
        if (d.x < divider.x) {
          leftSlowBalls += weight; // Add weight to the left side
        } else {
          rightSlowBalls += weight; // Add weight to the right side
        }
      }
    });
    return rightSlowBalls > 0
      ? leftSlowBalls / rightSlowBalls
      : leftSlowBalls > 0
        ? 2
        : 1;
  }

  function updateSeesawAngle() {
    const ballratio = getBallRatio();
    if (ballratio == 1) {
      if (Math.abs(seesaw.slope) < 0.001) {
        seesaw.vs *= 0.9;
      } else {
        seesaw.vs += Math.sign(seesaw.slope) * -seesaw.speed;
      }
      seesaw.slope += seesaw.vs;
    } else if (
      seesaw.slope > -seesaw.maxAngle &&
      seesaw.slope < seesaw.maxAngle
    ) {
      seesaw.vs += ballratio > 1 ? -seesaw.speed : seesaw.speed;
      seesaw.slope += seesaw.vs;
    } else {
      seesaw.vs = 0;
    }
  }

  function getSideCount() {
    const emojis = getEmojis();
    const sideCountA = emojis
      .filter((e) => e.group === 0)
      .reduce((sum, e) => sum + e.count, 0);
    const sideCountB = emojis
      .filter((e) => e.group === 1)
      .reduce((sum, e) => sum + e.count, 0);
    return [sideCountA, sideCountB];
  }

  export function draw(votes) {
    const svgElement = d3.select(svgRef);
    [, , width, height] = svgElement.attr("viewBox").split(" ").map(Number);

    currentVotes = votes;
    const emojis = getEmojis();
    const allCounts = emojis.reduce((sum, e) => sum + e.count, 0);
    const minRadius = getMinRadius(allCounts);
    balls = emojis.map((e) => createBall(e, minRadius));

    const dampeningFactor = 0.5; // Damping factor when hitting an object
    const objectSpacing = 0.6; // Empty space between objects

    simulation = d3
      .forceSimulation(balls)
      .alphaDecay(0)
      .velocityDecay(0)
      .force(
        "collide",
        d3
          .forceCollide((d) => d.r + objectSpacing)
          .strength(0.2)
          .iterations(2),
      )
      .force("gravity", d3.forceY(height).strength(0.001)) // Add downward gravity
      .on("tick", ticked);

    addCollision(dampeningFactor, objectSpacing);

    updateSeesaw();

    [sideCountA, sideCountB] = getSideCount();

    function ticked() {
      // Stop the simulation after X loops
      ticks++;
      if (ticks > 1000) {
        simulation.stop();
        return;
      }

      updateSeesaw();

      // Bind the updated balls data to the selection
      const ballSelection = svgElement
        .selectAll(".emoji")
        .data(balls, (d) => d.emoji + "_" + d.side);

      // Handle the "enter" selection (new elements)
      ballSelection
        .enter()
        .append("text")
        .attr("class", "emoji")
        .attr("text-anchor", "middle") // Align text to the center
        .attr("dominant-baseline", "middle") // Vertically center the text
        .attr("font-size", (d) => 1.9 * d.r) // Font size proportional to the circle radius
        .attr("fill", "black") // Text color
        .text((d) => d.emoji) // Set the emoji text
        .merge(ballSelection) // Merge the "enter" selection with the "update" selection
        .attr("x", (d) => d.x) // Update x position
        .attr("y", (d) => d.y); // Update y position

      // Handle the "exit" selection (remove elements no longer in the data)
      ballSelection.exit().remove();

      d3.selectAll(".emoji").attr("font-size", (d) => 1.9 * d.r);

      beam
        .attr("x", seesaw.x1 - seesaw.height)
        .attr("y", seesaw.y1)
        .attr(
          "transform",
          `rotate(${seesaw.angle}, ${seesaw.x1}, ${seesaw.y1})`,
        );
      rightSeat
        .attr("x", seats.rx)
        .attr("y", seats.ry)
        .attr("transform", `rotate(${seesaw.angle}, ${seats.rx}, ${seats.ry})`);
      leftSeat
        .attr("x", seats.lx - seesaw.height)
        .attr("y", seats.ly)
        .attr("transform", `rotate(${seesaw.angle}, ${seats.lx}, ${seats.ly})`);
    }

    // Draw the emojis
    const circles = svgElement
      .selectAll("text")
      .data(balls)
      .enter()
      .append("text")
      .attr("class", "emoji")
      .attr("x", (d) => d.x) // Center horizontally
      .attr("y", (d) => d.y) // Center vertically (adjusted for text baseline)
      .attr("text-anchor", "middle") // Align text to the center
      .attr("dominant-baseline", "central") // Vertically center the text
      .attr("font-size", (d) => 1.9 * d.r) // Font size proportional to the circle radius
      .attr("fill", "black") // Text color
      .text((d) => d.emoji); // Replace with the desired emoji

    // Draw the bouncer
    const bouncerSize = 14;
    const bouncerColor = "#333333";
    svgElement
      .append("circle")
      .attr("class", "bouncer")
      .attr("cx", seesaw.centerX - (seesaw.length * 0.92) / 2)
      .attr("cy", height + bouncerSize / 4)
      .attr("r", bouncerSize)
      .attr("fill", bouncerColor);
    svgElement
      .append("circle")
      .attr("class", "bouncer")
      .attr("cx", seesaw.centerX + (seesaw.length * 0.92) / 2)
      .attr("cy", height + bouncerSize / 4)
      .attr("r", bouncerSize)
      .attr("fill", bouncerColor);

    // Draw the beam
    const beamColor = "#A1662F"; // #D9992F
    const beam = svgElement
      .append("rect")
      .attr("class", "seesaw-rect")
      .attr("x", seesaw.x1 - seesaw.height)
      .attr("y", seesaw.y1)
      .attr("width", seesaw.length + 2 * seesaw.height)
      .attr("height", seesaw.height)
      .attr("fill", beamColor)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("transform", `rotate(${seesaw.angle}, ${seesaw.x1}, ${seesaw.y1})`);

    // Draw the seats
    const leftSeat = svgElement
      .append("rect")
      .attr("class", "seat")
      .attr("x", seats.lx - seesaw.height)
      .attr("y", seats.ly)
      .attr("width", seesaw.height)
      .attr("height", seats.length + seesaw.height)
      .attr("fill", beamColor)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("transform", `rotate(${seesaw.angle}, ${seats.lx}, ${seats.ly})`);
    const rightSeat = svgElement
      .append("rect")
      .attr("class", "seat")
      .attr("x", seats.rx)
      .attr("y", seats.ry)
      .attr("width", seesaw.height)
      .attr("height", seats.length + seesaw.height)
      .attr("fill", beamColor)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("transform", `rotate(${seesaw.angle}, ${seats.rx}, ${seats.ry})`);

    // Draw the divider
    const trapezoidHeight = 50;
    const topWidth = divider.r * 2;
    const bottomWidth = topWidth * 1.8;
    const trapezoidTopX = divider.x - topWidth / 2;
    const trapezoidBottomX = divider.x - bottomWidth / 2;
    svgElement
      .append("circle")
      .attr("class", "divider")
      .attr("cx", divider.x)
      .attr("cy", divider.y)
      .attr("r", divider.r)
      .attr("fill", "lightgray");
    svgElement
      .append("polygon")
      .attr("class", "trapezoid")
      .attr(
        "points",
        `
      ${trapezoidTopX + divider.r / 20},${divider.y - divider.r / 3} 
      ${trapezoidTopX + topWidth - divider.r / 20},${divider.y - divider.r / 3} 
      ${trapezoidBottomX + bottomWidth},${divider.y + divider.r + trapezoidHeight} 
      ${trapezoidBottomX},${divider.y + divider.r + trapezoidHeight}
    `,
      )
      .attr("fill", "lightgray");
    svgElement
      .append("circle")
      .attr("class", "divider-donut")
      .attr("cx", divider.x)
      .attr("cy", divider.y)
      .attr("r", divider.r / 2)
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("stroke-width", 8);
  }

  export function update(votes, newVote) {
    currentVotes = votes;
    if (newVote) {
      const emojis = getEmojis();

      // update the radii of all balls
      const allCounts = emojis.reduce((sum, e) => sum + e.count, 0);
      const minRadius = getMinRadius(allCounts);
      balls.forEach((b) => {
        b.r = Math.sqrt(b.count * minRadius * minRadius);
      });
      // Remove old ball with same emoji and side (group)
      const newEmoji = emojis.find(
        (e) =>
          e.emoji === newVote.emoji &&
          e.group === (newVote.idol === "Wizard" ? 1 : 0),
      );
      const oldIndex = balls.findIndex(
        (b) => b.emoji === newEmoji.emoji && b.side === newEmoji.group,
      );
      if (oldIndex !== -1) {
        balls.splice(oldIndex, 1);
      }

      // Add new ball
      const ball = createBall(newEmoji, minRadius);
      balls.push(ball);
      simulation.nodes(balls);
      ticks = 0;
      simulation.stop();
      simulation.restart();

      [sideCountA, sideCountB] = getSideCount();
      d3.select("#sideALabel").transition().duration(500).text(sideCountA);
      d3.select("#sideBLabel").transition().duration(500).text(sideCountB);
    }
  }
</script>

<div class="vis-component double">
  <h2>
    {$t.herotitle}
  </h2>
  <svg bind:this={svgRef} viewBox="0 0 600 300">
    <!-- Clip path definition -->
    <defs>
      <clipPath id="edgesClip">
        <rect
          x="0"
          y="0"
          {width}
          {height}
          rx={cornerRadius}
          ry={cornerRadius}
        />
      </clipPath>
    </defs>

    <!-- Background rectangles -->
    <rect
      class="background"
      x="0"
      y="0"
      width={width / 2}
      {height}
      fill={colorA}
      clip-path="url(#edgesClip)"
    />
    <rect
      class="background"
      x={width / 2}
      y="0"
      width={width / 2}
      {height}
      fill={colorB}
      clip-path="url(#edgesClip)"
    />

    <!-- Grass image -->
    <image
      xlink:href="{base}/grass.png"
      x="2"
      y={height - 20}
      {width}
      height="20"
      preserveAspectRatio="none"
      clip-path="url(#edgesClip)"
    />

    <!-- Superhero Icon -->
    <image
      xlink:href="{base}/superhero.png"
      x={width / 4 - iconSize / 2}
      y={iconY}
      width={iconSize}
      height={iconSize}
    />

    <!-- Wizard Icon -->
    <image
      xlink:href="{base}/wizard.png"
      x={(width * 3) / 4 - iconSize / 2}
      y={iconY}
      width={iconSize}
      height={iconSize}
    />

    <!-- Side A Label -->
    <text
      id="sideALabel"
      x={width / 4}
      y={iconY + iconSize + textSpacing + textSize / 2}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={textSize}
      font-weight="bold"
      fill="black"
    >
      {sideCountA}
    </text>

    <!-- Side B Label -->
    <text
      id="sideBLabel"
      x={(width * 3) / 4}
      y={iconY + iconSize + textSpacing + textSize / 2}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={textSize}
      font-weight="bold"
      fill="black"
    >
      {sideCountB}
    </text>

    <!-- Side A "votes" -->
    <text
      x={width / 4}
      y={iconY + iconSize + 1.8 * textSpacing + textSize}
      text-anchor="middle"
      font-size={textSize / 3}
      fill="black"
    >
      {$t.votes}
    </text>

    <!-- Side B "votes" -->
    <text
      x={(width * 3) / 4}
      y={iconY + iconSize + 1.8 * textSpacing + textSize}
      text-anchor="middle"
      font-size={textSize / 3}
      fill="black"
    >
      {$t.votes}
    </text>
  </svg>
</div>

<style>
  .wizard {
    color: #5f85d9;
  }

  .hero {
    color: #da4b54;
  }
</style>
