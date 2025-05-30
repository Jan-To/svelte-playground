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
  import Timetravel from "$lib/Timetravel.svelte";
  import Swarm from "$lib/Swarm.svelte";
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
  let timetravelRef;
  let swarmRef;

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
          timetravelRef.draw(currentVotes);
          swarmRef.draw(currentVotes);
          if (newestVote) {
            mapRef.update(currentVotes, newestVote);
            ballsRef.update(currentVotes, newestVote);
            gaugesRef.update(currentVotes, newestVote);
            timetravelRef.update(currentVotes, newestVote);
          }

          updateKPI();
        } else {
          await restartAnimations();
          await delay(4000);
          swarmRef.update(currentVotes);
          await delay(1500);
          mapRef.update(currentVotes, newestVote);
          await delay(1500);
          ballsRef.update(currentVotes, newestVote);
          await delay(1500);
          gaugesRef.update(currentVotes, newestVote);
          await delay(1500);
          timetravelRef.update(currentVotes, newestVote);
          updateKPI();
        }
      },
    );
    // cleanup if component is destroyed
    return () => unsubscribe();
  });
</script>

<div class="page">
  <div class="header">
    <div class="headline-images">
      <img
        src="{base}/database_cloud.png"
        alt="Database"
        class="headline-img"
      />
      <img
        src="{base}/doc.png"
        alt="Document"
        class="document animate-document"
      />
    </div>
    <!-- <span
      class="kpi-change-label kpi-details"
      style="text-align: center; margin-left:3vw;"
      >Take part <br />in the poll</span
    >
    <img src="{base}/qr.png" alt="QR Code" class="qr-img" /> -->
    <div class="headline-text">
      <h1 class="headline">See Beyond the Numbers</h1>
      <h2 class="headline">Watch Your Data Come to Life</h2>
    </div>
    <!-- <div style="width:12vw"></div> -->
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
        class="line-path"
        d="m0 5c0 11 6 22 21 22L3000 27"
        stroke="#f2f2f2"
        stroke-width="10"
        stroke-linecap="round"
        fill="none"
      />
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

    <Timetravel bind:this={timetravelRef} />

    <Swarm bind:this={swarmRef} />

    <div class="vis-component">
      <h2>Take part in the poll</h2>
      <div class="qr-container">
        <a href="{base}/poll">
          <img src="{base}/qr-trans.png" alt="QR Code" class="qr-img" /></a
        >
      </div>
    </div>
  </div>
</div>

<footer>
  <span>Made with</span>
  <img src="{base}/svelte.png" alt="svelteLogo" class="footer-img" />
  <img src="{base}/firebase.png" alt="firebaseLogo" class="footer-img" />
  <img src="{base}/github.png" alt="githubLogo" class="footer-img" />
  <span>at</span>
  <img
    src="{base}/heikeLogo.png"
    alt="heikeLogo"
    style="height:85%;"
    class="footer-img"
  />
  <img src="{base}/rptuLogo.png" alt="rptuLogo" class="footer-img" />
</footer>

<style>
  :root {
    --vis-min-width: 100px;
    --vis-max-width: 700px;
    --doc-delay: 4s;
    --doc-update: 6s;
  }

  :global(body) {
    margin: 0;
  }

  .page {
    margin: 0 2.5vw;
    margin-top: 0.5vw;
  }
  .qr-container {
    width: 100%;
    aspect-ratio: 2 / 1;
    position: relative;
  }
  .qr-img {
    /* height: 6vw; */
    height: 100%;
    width: auto;
    margin: 0 auto;
    display: block;
  }

  .headline {
    display: block;
    text-align: center;
    margin: 0.5vw 0;
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
    padding-top: 1.5vw;
    padding-left: 1vw;
  }

  .headline-img {
    height: auto;
    width: auto;
    max-width: 4.5vw;
    object-fit: contain;
    position: relative;
    z-index: 2;
  }

  .document {
    height: auto;
    max-width: 3.3vw;
    position: absolute;
    z-index: 1;
    padding-top: 0.5vw;
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
    16%,
    28%,
    40%,
    52%,
    64%,
    76% {
      transform: translateY(-2.2vw) rotate(-7deg);
    }
    22%,
    34%,
    46%,
    58%,
    70%,
    82% {
      transform: translateY(-2.2vw) rotate(7deg);
    }
    88% {
      transform: translateY(-2.2vw) rotate(0deg);
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

  .animate-line-path {
    stroke-dasharray: 3020;
    stroke-dashoffset: 3020;
    animation: draw-line var(--doc-update) ease-in-out var(--doc-delay) forwards;
  }

  @keyframes draw-line {
    0% {
      stroke-dashoffset: 3020;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }

  .vis-grid {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 2vw;
    align-items: start;
    width: 100%;
    box-sizing: border-box;
    margin: 1vw 0;
  }

  :global(.vis-component) {
    min-width: var(--vis-min-width);
    max-width: var(--vis-max-width);
    background-color: #f8fafc;
    border-radius: 16px;
    margin: 0;
    box-shadow: 0 2px 8px #0002;
    transition: box-shadow 0.2s;
    overflow: hidden;
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
    font-size: clamp(0rem, 1.8vw, 50rem);
    margin: 1vw 0 0.5vw 0;
  }

  :global(.vis-component svg) {
    display: block;
  }

  footer {
    background-color: #e4e4e4;
    display: flex;
    align-items: center;
    justify-content: end;
    padding: 0 2.5vw;
    gap: 1vw;
    height: 2vw;
    margin-top: 2vw;
    font-size: clamp(0rem, 0.7vw, 50rem);
  }
  .footer-img {
    height: 75%;
    width: auto;
  }
</style>
