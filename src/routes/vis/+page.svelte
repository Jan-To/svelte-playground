<script>
  import { onMount, tick } from "svelte";
  import { base } from "$app/paths";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { initializeApp } from "firebase/app";
  import { getFirestore, collection, onSnapshot } from "firebase/firestore";
  import Balls from "$lib/Balls.svelte";
  import Gauges from "$lib/Gauges.svelte";
  import Map from "$lib/Map.svelte";
  import { map } from "d3";

  // Firebase configuration (hide this in production)
  const firebaseConfig = {
    apiKey: "AIzaSyCLy32m7EM89CbGrgndgoyK7kTgriPQ2hE",
    authDomain: "poll-app-42740.firebaseapp.com",
    projectId: "poll-app-42740",
    storageBucket: "poll-app-42740.firebasestorage.app",
    messagingSenderId: "815673349264",
    appId: "1:815673349264:web:06562603e0738d64a5f415",
  };
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  let oldVotes = [];
  let currentVotes = [];
  let newVote = {};
  const animatedVotes = tweened(0, { duration: 800, easing: cubicOut });
  const votesLastHour = tweened(0, { duration: 800, easing: cubicOut });

  function updateKPI() {
    animatedVotes.set(currentVotes.length);
    votesLastHour.set(
      currentVotes.filter(
        (v) => v.time && Date.now() / 1000 - v.time.seconds < 60 * 60,
      ).length,
    );
  }

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  async function restartAnimations() {
    const animationClasses = ["document", "line-path"];
    for (const c of animationClasses) {
      const el = document.querySelector("." + c);
      el.classList.remove("animate-" + c);
      void el.offsetWidth;
      await delay(10);
      el.classList.add("animate-" + c);
    }
  }

  let ballsRef;
  let gaugesRef;
  let mapRef;

  onMount(() => {
    const unsubscribe = onSnapshot(
      collection(db, "votes"),
      async (snapshot) => {
        oldVotes = currentVotes;
        currentVotes = snapshot.docs.map((doc) => doc.data());
        const newestVote = currentVotes
          .filter((v) => v.time)
          .sort((a, b) => b.time - a.time)[0];
        await tick();
        console.log("got new Votes:", currentVotes);
        if (oldVotes.length == 0) {
          ballsRef.draw(currentVotes);
          gaugesRef.draw(currentVotes);
          mapRef.draw(currentVotes);
          mapRef.update(currentVotes, newestVote);
          ballsRef.update(currentVotes, newestVote);
          gaugesRef.update(currentVotes, newestVote);
          updateKPI();
        } else {
          await restartAnimations();
          await delay(4000);
          await delay(1500);
          mapRef.update(currentVotes, newestVote);
          await delay(1500);
          ballsRef.update(currentVotes, newestVote);
          await delay(1500);
          gaugesRef.update(currentVotes, newestVote);
          await delay(1500);
          updateKPI();
        }
      },
    );
    // cleanup if component is destroyed
    return () => unsubscribe();
  });
</script>

<div class="header">
  <div class="headline-images">
    <img src="{base}/database_gear.png" alt="Database" class="headline-img" />
    <img
      src="{base}/doc.png"
      alt="Document"
      class="document animate-document"
    />
  </div>
  <div class="headline-text">
    <h1 class="headline">See Beyond the Numbers</h1>
    <h2 class="headline">Watch Your Data Come to Life</h2>
  </div>
  <div class="kpi-participants">
    <span class="kpi-label">PARTICIPANTS</span>
    <div class="kpi-numbers">
      <span class="kpi-value">{Math.round($animatedVotes)}</span>
      <div class="kpi-details">
        <span class="kpi-change">&#9650;{Math.round($votesLastHour)}</span>
        <span class="kpi-change-label">last h</span>
      </div>
    </div>
  </div>
</div>
<div class="update-line-container">
  <svg class="update-line" viewBox="-5 0 3010 35" preserveAspectRatio="none">
    <path
      class="line-path animate-line-path"
      d="m0 5c0 11 6 22 21 22L3000 27"
      stroke="#4C5B94"
      stroke-width="10"
      stroke-linecap="round"
      fill="none"
    />
  </svg>
</div>
<div class="vis-grid">
  <Map bind:this={mapRef} />

  <Balls bind:this={ballsRef} />

  <Gauges bind:this={gaugesRef} />
</div>

<style>
  :root {
    --vis-min-width: 100px;
    --vis-max-width: 500px;
    --doc-delay: 4s;
  }

  .headline {
    display: block;
    text-align: center;
    margin: 5px 0;
  }
  h2.headline {
    font-weight: normal;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .headline-text {
    flex: 1 1 auto;
    min-width: 0;
  }

  .headline-images {
    display: flex;
    padding-top: 2vw;
    padding-left: 1vw;
  }

  .headline-img {
    height: auto;
    width: auto;
    max-width: 4vw;
    object-fit: contain;
    position: relative;
    z-index: 2;
  }

  .document {
    height: auto;
    max-width: 3.3vw;
    position: absolute;
    z-index: 1;
    padding-top: 0.3vw;
  }

  .animate-document {
    animation: updown var(--doc-delay) linear;
  }

  @keyframes updown {
    0% {
      transform: translateY(0);
    }
    10% {
      transform: translateY(-2.2vw);
    }
    16% {
      transform: translateY(-2.2vw) rotate(-6deg);
    }
    22% {
      transform: translateY(-2.2vw) rotate(7deg);
    }
    28% {
      transform: translateY(-2.2vw) rotate(-5deg);
    }
    34% {
      transform: translateY(-2.2vw) rotate(3deg);
    }
    40% {
      transform: translateY(-2.2vw) rotate(0deg);
    }
    46% {
      transform: translateY(-2.2vw);
    }
    90% {
      transform: translateY(-2.2vw);
    }
    100% {
      transform: translateY(0);
    }
  }

  .kpi-participants {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .kpi-label {
    font-size: clamp(0rem, 1vw, 50rem);
    color: #a2a2a2;
    margin-top: 5px;
  }
  .kpi-numbers {
    display: flex;
    align-items: flex-end;
    gap: 0.5vw;
  }

  .kpi-value {
    font-size: clamp(0rem, 4vw, 50rem);
    font-weight: 600;
    line-height: 1;
  }

  .kpi-details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    font-size: clamp(0rem, 1.3vw, 50rem);
    margin-bottom: 0.4vw;
  }

  .update-line-container {
    width: auto;
    height: 1vw;
    position: relative;
    margin: 0 2.5vw;
  }

  .update-line {
    position: absolute;
    left: 0;
    top: -5px;
    width: 100%;
    height: 100%;
  }

  .line-path {
    stroke-dasharray: 3020;
    stroke-dashoffset: 3020;
  }

  .animate-line-path {
    animation: draw-line 6s ease-in-out var(--doc-delay) forwards;
  }

  @keyframes draw-line {
    from {
      stroke-dashoffset: 3020;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  .vis-grid {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 2%;
    align-items: start;
    width: 100%;
    height: 100vh;
    box-sizing: border-box;
  }

  :global(.vis-component) {
    min-width: var(--vis-min-width);
    max-width: var(--vis-max-width);
    background-color: #f8fafc;
    border-radius: 16px;
    margin: 0.4rem 0;
    box-shadow: 0 2px 8px #0002;
    transition: box-shadow 0.2s;
  }

  :global(.vis-component.double) {
    min-width: calc(2 * var(--vis-min-width));
    max-width: calc(2 * var(--vis-max-width));
  }
  :global(h1) {
    text-align: center;
    font-size: clamp(0rem, 2.5vw, 50rem);
  }
  :global(h2) {
    text-align: center;
    font-size: clamp(0rem, 2vw, 50rem);
    margin-bottom: 0.5rem;
  }

  :global(.vis-component svg) {
    display: block;
  }
</style>
