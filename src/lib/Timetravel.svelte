<script>
  import { base } from "$app/paths";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const retro_path = base + "/retro_round.png";
  const future_path = base + "/future_round.png";

  let futurePercent = tweened(1, {
    duration: 500,
    easing: cubicOut,
  });
  let retroPercent = tweened(0, {
    duration: 500,
    easing: cubicOut,
  });

  function removeAnimation(c) {
    const el = document.querySelector("." + c);
    el.classList.remove(c + "-animate");
  }

  function addAnimation(c) {
    const el = document.querySelector("." + c);
    el.classList.add(c + "-animate");
  }

  async function resetAnimation(c) {
    removeAnimation(c);
    await delay(10);
    addAnimation(c);
  }

  async function restartAnimations(where) {
    const whereStrings = ["past", "future"];
    const animationClasses = [
      "beam-" + whereStrings[where],
      "person",
      "beam-in",
    ];
    for (const c of animationClasses) {
      resetAnimation(c);
    }
  }

  function getTravelCounts(votes) {
    const travelCounts = { Past: 0, Future: 0 };
    votes.forEach((d) => {
      const travel = d.timetravel;
      travelCounts[travel] += 1;
    });
    return travelCounts;
  }

  function setTravelPercent(travelCounts) {
    const allCounts = travelCounts["Past"] + travelCounts["Future"];
    retroPercent.set(travelCounts["Past"] / allCounts);
    futurePercent.set(travelCounts["Future"] / allCounts);
  }

  export function draw(votes) {
    setTravelPercent(getTravelCounts(votes));
  }

  export async function update(votes, newestVote) {
    const travel = newestVote.timetravel;
    if (travel === "Past") {
      restartAnimations(0);
    } else {
      restartAnimations(1);
    }
    await delay(6750);
    setTravelPercent(getTravelCounts(votes));
  }
</script>

<div class="vis-component">
  <h2>The past or the future?</h2>
  <div class="timetravel-container">
    <!-- Retro image -->
    <div class="img-wrap">
      <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; z-index: 6;"
        ><circle
          style="cx:50%; cy:50%; r:48%; fill: none; stroke: #e4e4e4; stroke-width: 2.5%;"
        ></circle></svg
      >
      <img
        src={retro_path}
        alt="Retro"
        class="base-img"
        style="mask-imager: radial-gradient(black 65%, transparent 70%)"
      />
      <img
        src={retro_path}
        alt="Retro Color"
        class="color-img"
        style="mask-image: radial-gradient(black {Math.sqrt($retroPercent) *
          68}%, transparent {Math.sqrt($retroPercent) * 68 + 5}%);"
      />
      <!-- <div class="shadow"></div> -->
      <span class="label">{Math.round($retroPercent * 100)}%</span>
      <img src="{base}/beaming.gif" alt="beam" class="beam beam-past" />
    </div>
    <!-- Future image -->
    <div class="img-wrap">
      <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; z-index: 6;"
        ><circle
          style="cx:50%; cy:50%; r:48%; fill: none; stroke: #e4e4e4; stroke-width: 2.5%;"
        ></circle></svg
      >
      <img
        src={future_path}
        alt="Future"
        class="base-img"
        style="mask-imager: radial-gradient(black 65%, transparent 70%)"
      />
      <img
        src={future_path}
        alt="Future Color"
        class="color-img"
        style="mask-image: radial-gradient(black {Math.sqrt($futurePercent) *
          68}%, transparent {Math.sqrt($futurePercent) * 68 + 5}%)"
      />
      <!-- <div class="shadow"></div> -->
      <span class="label">{Math.round($futurePercent * 100)}%</span>
      <img src="{base}/beaming.gif" alt="beam" class="beam beam-future" />
    </div>
    <div class="beam-container">
      <div class="beam-wrap">
        <img src="{base}/beaming.gif" alt="beam" class="beam beam-in" />
        <svg class="person" viewBox="0 0 512 512">
          <g>
            <path
              class="st0"
              fill="#4C5C94"
              d="M256,85.549c23.636,0,42.779-19.158,42.779-42.77C298.778,19.142,279.636,0,256,0
        s-42.778,19.142-42.778,42.778C213.221,66.391,232.364,85.549,256,85.549z"
            />
            <path
              class="st0"
              fill="#4C5C94"
              d="M312.196,97.623H199.804c-20.725,0-43.274,22.549-43.274,43.282v143.768c0,10.364,8.396,18.767,18.758,18.767
        c10.363,0,18.775-8.403,18.775-18.767V166.468h8.651v320.88c0,13.617,11.035,24.651,24.644,24.651
        c13.625,0,24.66-11.034,24.66-24.651V301.138h7.964v186.211c0,13.617,11.034,24.651,24.66,24.651
        c13.609,0,24.643-11.034,24.643-24.651v-320.88h8.668v118.205c0,10.364,8.396,18.767,18.758,18.767
        c10.379,0,18.759-8.403,18.759-18.767V140.905C355.47,120.172,332.922,97.623,312.196,97.623z"
            />
          </g>
        </svg>
      </div>
    </div>
  </div>
</div>

<style>
  .beam-container {
    position: absolute;
    top: -1vw;
  }
  .beam-wrap {
    position: relative;
    overflow: hidden;
    width: 4vw;
    height: 4vw;
  }
  .person {
    position: absolute;
    top: 15%;
    left: 15%;
    width: auto;
    height: 70%;
    transform: scale(0);
  }

  .beam-wrap :global(.person-animate) {
    animation: beam-person 6s ease-in-out;
  }

  @keyframes beam-person {
    0% {
      transform: rotate(0deg) scale(0);
    }
    2% {
      transform: rotate(0deg) scale(1);
    }
    65% {
      transform: rotate(0deg) scale(1);
    }
    70% {
      transform: rotate(0deg) scale(1.1);
    }
    100% {
      transform: rotate(720deg) scale(0);
    }
  }

  .beam {
    position: absolute;
    width: auto;
    height: 100%;
    mask-repeat: no-repeat;
    mask-position: center;
    mask-size: 0% 0%;
  }

  .beam-wrap .beam {
    top: 0;
    margin: 0 0 0 -38%;
    mask-image: radial-gradient(circle at center, black 45%, transparent 50%);
  }

  .beam-wrap :global(.beam-in-animate) {
    animation: beam-mask-in 6s ease-in-out;
  }

  @keyframes beam-mask-in {
    0%,
    50%,
    100% {
      mask-size: 0% 0%;
    }
    70%,
    90% {
      mask-size: 100% 100%;
    }
  }

  .img-wrap :global(.beam-past),
  .img-wrap :global(.beam-future) {
    height: 90%;
    top: 10;
    z-index: 3;
    mask-image: radial-gradient(circle at center, black 48%, transparent 48%);
  }

  .img-wrap :global(.beam-past-animate),
  .img-wrap :global(.beam-future-animate) {
    animation: beam-mask-out 1.5s ease-in-out 6s;
  }

  @keyframes beam-mask-out {
    0%,
    100% {
      mask-size: 0% 0%;
    }
    40%,
    70% {
      mask-size: 100% 100%;
    }
  }

  .timetravel-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }
  .img-wrap {
    position: relative;
    width: 18vw;
    aspect-ratio: 1/1;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    margin: 0.5vw;
  }
  .base-img,
  .color-img {
    position: absolute;
    top: 12;
    left: 12;
    width: 88%;
    height: 88%;
    object-fit: contain;
    border-radius: 50%;
    pointer-events: none;
    user-select: none;
  }
  .base-img {
    filter: grayscale(1);
    z-index: 1;
    opacity: 0.7;
  }
  .color-img {
    z-index: 2;
    mask-repeat: no-repeat;
    mask-size: 100% 100%;
    mask-position: center;
  }

  /* .shadow {
    width: 100%;
    height: 100%;
    border-radius: 49%;
    z-index: 3;
    box-shadow: inset 0px 0px 0.25vw 0.25vw white;
  } */
  .label {
    text-anchor: middle;
    font-size: 2vw;
    color: white;
    z-index: 4;
    position: absolute;
  }
</style>
