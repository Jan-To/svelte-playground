<script>
  import * as d3 from "d3";
  import { t } from "$lib/i18n.js";

  let { config } = $props();

  let svgEl;
  let gaugeUpdater;
  const drinkList = ["Coffee", "Tea", "Water", "Juice"];
  let label = $state("");
  let labelText = $derived($t.drinksoptions[drinkList.indexOf(label)]);
  $effect(() => {
    const newLabel = labelText;
    const gaugeLabel = d3.select(svgEl).select(".gaugeLabelText");
    if (!gaugeLabel.empty()) {
      gaugeLabel.text(newLabel);
    }
  });
  const radius = 100;
  const textPixels = (0.7 * radius) / 2;
  const labelTextPixels = (0.6 * radius) / 2;
  const percentText = "%";
  const circleThickness = 0.05 * radius;
  const circleFillGap = 0.05 * radius;
  const fillCircleMargin = circleThickness + circleFillGap;
  const fillCircleRadius = radius - fillCircleMargin;

  // Scale for controlling the position of the text within the gauge.
  const textRiseScaleY = d3
    .scaleLinear()
    .range([
      fillCircleMargin + fillCircleRadius * 2,
      fillCircleMargin + textPixels * 0.7,
    ])
    .domain([0, 1]);

  export function draw(value) {
    config.value = value;
    gaugeUpdater = loadLiquidFillGauge(svgEl, config);
  }

  export function update(value, drip) {
    config.value = value;
    gaugeUpdater.update(value, drip);
  }

  function loadLiquidFillGauge(svg, config) {
    if (config !== null) config = config;

    const value = config.value;
    label = config.label;
    const gauge = d3.select(svg);
    const [, , width, height] = gauge.attr("viewBox").split(" ").map(Number);

    const locationX = width / 2 - radius;
    const locationY = height / 2 - radius;
    const fillPercent =
      Math.max(config.minValue, Math.min(config.maxValue, value)) /
      config.maxValue;

    let waveHeightScale = null;
    if (config.waveHeightScaling) {
      waveHeightScale = d3
        .scaleLinear()
        .range([0, config.waveHeight, 0])
        .domain([0, 50, 100]);
    } else {
      waveHeightScale = d3
        .scaleLinear()
        .range([config.waveHeight, config.waveHeight])
        .domain([0, 100]);
    }

    const textFinalValue = parseFloat(value).toFixed(2);
    const textStartValue = config.valueCountUp
      ? config.minValue
      : textFinalValue;
    const waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);

    const waveLength = (fillCircleRadius * 2) / config.waveCount;
    const waveClipCount = 1 + config.waveCount;
    const waveClipWidth = waveLength * waveClipCount;

    // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
    let textRounder = function (value) {
      return Math.round(value);
    };
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
      textRounder = function (value) {
        return parseFloat(value).toFixed(1);
      };
    }
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
      textRounder = function (value) {
        return parseFloat(value).toFixed(2);
      };
    }

    // Data for building the clip wave area.
    const data = [];
    for (let i = 0; i <= 40 * waveClipCount; i++) {
      data.push({ x: i / (40 * waveClipCount), y: i / 40 });
    }

    // Scales for drawing the outer circle.
    const gaugeCircleX = d3
      .scaleLinear()
      .range([0, 2 * Math.PI])
      .domain([0, 1]);
    const gaugeCircleY = d3
      .scaleLinear()
      .range([0, radius])
      .domain([0, radius]);

    // Scales for controlling the size of the clipping path.
    const waveScaleX = d3
      .scaleLinear()
      .range([0, waveClipWidth])
      .domain([0, 1]);
    const waveScaleY = d3.scaleLinear().range([0, waveHeight]).domain([0, 1]);

    // Scales for controlling the position of the clipping path.
    const waveRiseScale = d3
      .scaleLinear()
      // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
      // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
      // circle at 100%.
      .range([
        fillCircleMargin + fillCircleRadius * 2 + waveHeight,
        fillCircleMargin - waveHeight,
      ])
      .domain([0, 1]);
    const waveAnimateScale = d3
      .scaleLinear()
      .range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
      .domain([0, 1]);

    // Center the gauge within the parent SVG.
    const gaugeGroup = gauge
      .append("g")
      .attr("transform", "translate(" + locationX + "," + locationY + ")");

    // Draw the outer circle.
    const gaugeCircleArc = d3
      .arc()
      .startAngle(gaugeCircleX(0))
      .endAngle(gaugeCircleX(1))
      .outerRadius(gaugeCircleY(radius))
      .innerRadius(gaugeCircleY(radius - circleThickness));
    gaugeGroup
      .append("path")
      .attr("d", gaugeCircleArc)
      .style("fill", config.circleColor)
      .attr("transform", "translate(" + radius + "," + radius + ")");

    // Text where the wave does not overlap.
    const text1 = gaugeGroup
      .append("text")
      .text(textRounder(textStartValue) + percentText)
      .attr("class", "liquidFillGaugeText")
      .attr("text-anchor", "middle")
      .attr("font-size", textPixels + "px")
      .style("fill", config.textColor)
      .attr(
        "transform",
        "translate(" +
          radius +
          "," +
          textRiseScaleY(config.textVertPosition) +
          ")",
      );
    let text1InterpolatorValue = textStartValue;

    // The clipping wave area.
    const clipArea = d3
      .area()
      .x(function (d) {
        return waveScaleX(d.x);
      })
      .y0(function (d) {
        return waveScaleY(
          Math.sin(
            Math.PI * 2 * config.waveOffset * -1 +
              Math.PI * 2 * (1 - config.waveCount) +
              d.y * 2 * Math.PI,
          ),
        );
      })
      .y1(function (d) {
        return fillCircleRadius * 2 + waveHeight;
      });
    const waveGroup = gaugeGroup
      .append("defs")
      .append("clipPath")
      .attr("id", "clipWave" + label);
    const wave = waveGroup
      .append("path")
      .datum(data)
      .attr("d", clipArea)
      .attr("T", 0);

    // The inner circle with the clipping wave attached.
    var fillCircleGroup = gaugeGroup
      .append("g")
      .attr("clip-path", "url(#clipWave" + label + ")");
    fillCircleGroup
      .append("circle")
      .attr("cx", radius)
      .attr("cy", radius)
      .attr("r", fillCircleRadius)
      .style("fill", config.waveColor);

    // Text where the wave does overlap.
    const text2 = fillCircleGroup
      .append("text")
      .text(textRounder(textStartValue))
      .attr("class", "liquidFillGaugeText")
      .attr("text-anchor", "middle")
      .attr("font-size", textPixels + "px")
      .style("fill", config.waveTextColor)
      .attr(
        "transform",
        "translate(" +
          radius +
          "," +
          textRiseScaleY(config.textVertPosition) +
          ")",
      );
    let text2InterpolatorValue = textStartValue;

    // Label text where the wave does overlap.
    const labelText2 = fillCircleGroup
      .append("text")
      .text(labelText)
      .attr("class", "liquidFillGaugeText gaugeLabelText")
      .attr("text-anchor", "middle")
      .attr("font-size", labelTextPixels + "px")
      .style("fill", config.waveTextColor)
      .attr(
        "transform",
        "translate(" + radius + "," + textRiseScaleY(0.5) + ")",
      );

    // Make the value count up.
    if (config.valueCountUp) {
      text1
        .transition()
        .duration(config.waveRiseTime)
        .tween("text", function () {
          const i = d3.interpolateNumber(
            text1InterpolatorValue,
            textFinalValue,
          );
          return function (t) {
            text1InterpolatorValue = textRounder(i(t));
            // Set the gauge's text with the new value and append the % sign
            // to the end
            text1.text(text1InterpolatorValue + percentText);
          };
        });
      text2
        .transition()
        .duration(config.waveRiseTime)
        .tween("text", function () {
          const i = d3.interpolateNumber(
            text2InterpolatorValue,
            textFinalValue,
          );
          return function (t) {
            text2InterpolatorValue = textRounder(i(t));
            // Set the gauge's text with the new value and append the % sign
            // to the end
            text2.text(text2InterpolatorValue + percentText);
          };
        });
    }

    // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
    var waveGroupXPosition =
      fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
    if (config.waveRise) {
      waveGroup
        .attr(
          "transform",
          "translate(" + waveGroupXPosition + "," + waveRiseScale(0) + ")",
        )
        .transition()
        .duration(config.waveRiseTime)
        .attr(
          "transform",
          "translate(" +
            waveGroupXPosition +
            "," +
            waveRiseScale(fillPercent) +
            ")",
        )
        .on("start", function () {
          wave.attr("transform", "translate(1,0)");
        });
    } else {
      waveGroup.attr(
        "transform",
        "translate(" +
          waveGroupXPosition +
          "," +
          waveRiseScale(fillPercent) +
          ")",
      );
    }

    if (config.waveAnimate) animateWave();

    function animateWave() {
      wave.attr(
        "transform",
        "translate(" + waveAnimateScale(wave.attr("T")) + ",0)",
      );
      wave
        .transition()
        .duration(config.waveAnimateTime * (1 - wave.attr("T")))
        .ease(d3.easeLinear)
        .attr("transform", "translate(" + waveAnimateScale(1) + ",0)")
        .attr("T", 1)
        .on("end", function () {
          wave.attr("T", 0);
          animateWave(config.waveAnimateTime);
        });
    }

    function GaugeUpdater() {
      this.update = async function (value, drip) {
        var newFinalValue = parseFloat(value).toFixed(2);
        var textRounderUpdater = function (value) {
          return Math.round(value);
        };
        if (
          parseFloat(newFinalValue) !=
          parseFloat(textRounderUpdater(newFinalValue))
        ) {
          textRounderUpdater = function (value) {
            return parseFloat(value).toFixed(1);
          };
        }
        if (
          parseFloat(newFinalValue) !=
          parseFloat(textRounderUpdater(newFinalValue))
        ) {
          textRounderUpdater = function (value) {
            return parseFloat(value).toFixed(2);
          };
        }

        // Remove any existing droplet
        gaugeGroup.selectAll(".dropletCircle").remove();

        // Droplet animation parameters
        const dropletDuration = 1500; // ms
        const dropletDelay = 1000; // ms
        const delay = 3500; // ms
        if (drip) {
          const dropletPath =
            "M10 20c3.878 0 7.037-3.156 7.037-7.036 0-3.801-6.597-12.433-6.877-12.801L10 0l-.161.21c-.28.368-6.876 8.999-6.876 12.799C2.963 16.844 6.122 20 10 20z";

          const droplet = gaugeGroup
            .select("defs")
            .append("clipPath")
            .attr("id", "clipDroplet" + label)
            .append("path")
            .attr("d", dropletPath);

          // Append the droplet path BEFORE the text, so it's behind
          const dropletCircle = gaugeGroup
            .insert("circle", ":first-child")
            .attr("class", "dropletCircle")
            .attr("cx", radius)
            .attr("cy", radius)
            .attr("r", fillCircleRadius)
            .attr("fill", config.waveColor)
            .attr("clip-path", `url(#clipDroplet${label})`);

          function animateDroplet() {
            // Animation parameters
            const dropletStartY = -10;
            const dropletEndY = height + 10;
            const dropletX = radius - fillCircleMargin;
            const randomDelay = Math.random() * 1000 - 500;
            const randomShift = Math.random() * radius * 0.5 - radius / 4;
            droplet
              .attr(
                "transform",
                `translate(${dropletX + randomShift},${dropletStartY})`,
              )
              .transition()
              .delay(dropletDelay + randomDelay)
              .duration(dropletDuration)
              .ease(d3.easeExpIn)
              .attr(
                "transform",
                `translate(${dropletX + randomShift},${dropletEndY} )`,
              )
              .transition()
              .duration(0)
              .attr(
                "transform",
                `translate(${dropletX + randomShift},${dropletStartY})`,
              )
              .on("end", animateDroplet);
          }
          animateDroplet();
        }

        text1
          .transition()
          .delay(delay)
          .duration(config.waveRiseTime)
          .tween("text", function () {
            const i = d3.interpolateNumber(
              text1InterpolatorValue,
              newFinalValue,
            );
            return function (t) {
              text1InterpolatorValue = textRounder(i(t));
              // Set the gauge's text with the new value and append the % sign
              // to the end
              text1.text(text1InterpolatorValue + percentText);
            };
          });
        text2
          .transition()
          .delay(delay)
          .duration(config.waveRiseTime)
          .tween("text", function () {
            const i = d3.interpolateNumber(
              text2InterpolatorValue,
              newFinalValue,
            );
            return function (t) {
              text2InterpolatorValue = textRounder(i(t));
              text2.text(text2InterpolatorValue + percentText);
            };
          });

        var fillPercent =
          Math.max(config.minValue, Math.min(config.maxValue, value)) /
          config.maxValue;
        var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
        var waveRiseScale = d3
          .scaleLinear()
          .range([
            fillCircleMargin + fillCircleRadius * 2 + waveHeight,
            fillCircleMargin - waveHeight,
          ])
          .domain([0, 1]);
        var newHeight = waveRiseScale(fillPercent);
        var waveScaleX = d3
          .scaleLinear()
          .range([0, waveClipWidth])
          .domain([0, 1]);
        var waveScaleY = d3.scaleLinear().range([0, waveHeight]).domain([0, 1]);
        var newClipArea;
        if (config.waveHeightScaling) {
          newClipArea = d3
            .area()
            .x(function (d) {
              return waveScaleX(d.x);
            })
            .y0(function (d) {
              return waveScaleY(
                Math.sin(
                  Math.PI * 2 * config.waveOffset * -1 +
                    Math.PI * 2 * (1 - config.waveCount) +
                    d.y * 2 * Math.PI,
                ),
              );
            })
            .y1(function (d) {
              return fillCircleRadius * 2 + waveHeight;
            });
        } else {
          newClipArea = clipArea;
        }

        var newWavePosition = config.waveAnimate ? waveAnimateScale(1) : 0;
        wave
          .transition()
          .delay(delay)
          .duration(0)
          .transition()
          .duration(
            config.waveAnimate
              ? config.waveAnimateTime * (1 - wave.attr("T"))
              : config.waveRiseTime,
          )
          .ease(d3.easeLinear)
          .attr("d", newClipArea)
          .attr("transform", "translate(" + newWavePosition + ",0)")
          .attr("T", "1")
          .on("end", function () {
            if (config.waveAnimate) {
              wave.attr(
                "transform",
                "translate(" + waveAnimateScale(0) + ",0)",
              );
              animateWave(config.waveAnimateTime);
            }
          });
        waveGroup
          .transition()
          .delay(delay)
          .duration(config.waveRiseTime)
          .attr(
            "transform",
            "translate(" + waveGroupXPosition + "," + newHeight + ")",
          );
      };
    }
    return new GaugeUpdater();
  }
</script>

<svg class="gauge" bind:this={svgEl} viewBox="0 0 200 200">
  <text
    class="liquidFillGaugeText"
    text-anchor="middle"
    font-size={labelTextPixels + "px"}
    fill={config.textColor}
    transform={`translate(${radius}, ${textRiseScaleY(0.5)})`}
  >
    {labelText}
  </text>
</svg>

<style>
  .gauge {
    width: 100%;
    height: 90%;
  }
</style>
