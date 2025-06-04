<script>
  import { onMount, tick } from "svelte";
  import { base } from "$app/paths";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { initializeApp } from "firebase/app";
  import {
    getFirestore,
    collection,
    onSnapshot,
    getDocs,
    deleteDoc,
    doc,
  } from "firebase/firestore";
  import { map } from "d3";
  import Balls from "$lib/Balls.svelte";
  import Gauges from "$lib/Gauges.svelte";
  import Map from "$lib/Map.svelte";
  import Timetravel from "$lib/Timetravel.svelte";
  import Swarm from "$lib/Swarm.svelte";
  import { t, lang, setLang } from "$lib/i18n.js";
  import DeleteVotes from "$lib/DeleteVotes.svelte";

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

  let firstDraw = true;
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
    const animationClasses = ["document", "moving-line"];
    for (const c of animationClasses) {
      const el = document.querySelector("." + c);
      el.classList.remove("animate-" + c);
      void el.offsetWidth;
      await tick();
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
        currentVotes = snapshot.docs.map((doc) => doc.data());
        const newestVote = currentVotes
          .filter((v) => v.time)
          .sort((a, b) => b.time - a.time)[0];
        await tick();
        console.log("got new Votes:", currentVotes);
        if (firstDraw) {
          firstDraw = false;
          ballsRef.draw(currentVotes);
          gaugesRef.draw(currentVotes);
          mapRef.draw(currentVotes);
          timetravelRef.draw(currentVotes);
          swarmRef.draw(currentVotes);
          updateKPI();
        } else {
          await delay(2000);
          await restartAnimations();
          await delay(4000);
          gaugesRef.update(currentVotes, newestVote);
          await delay(1200);
          mapRef.update(currentVotes, newestVote);
          await delay(1500);
          ballsRef.update(currentVotes, newestVote);
          // await delay(500);
          timetravelRef.update(currentVotes, newestVote);
          // await delay(8000);
          swarmRef.update(currentVotes);
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
      <img src="{base}/doc.png" alt="Document" class="document" />
    </div>
    <!-- <span
      class="kpi-change-label kpi-details"
      style="text-align: center; margin-left:3vw;"
      >Take part <br />in the poll</span
    >
    <img src="{base}/qr.png" alt="QR Code" class="qr-img" /> -->
    <div class="headline-text">
      <h1 class="headline">{$t.title}</h1>
      <h2 class="headline">{$t.subtitle}</h2>
    </div>
    <!-- <div style="width:12vw"></div> -->
    <div class="kpi-participants">
      <span class="kpi-label">{$t.participants}</span>
      <div class="kpi-numbers">
        <span class="kpi-value">{Math.round($animatedVotes)}</span>
        <div class="kpi-details">
          <span class="kpi-change">&#9650;{Math.round($votesLastHour)}</span>
          <span class="kpi-change-label">{$t.lasth}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="update-line-container">
    <svg class="update-line" viewBox="-5 -5 3015 45" preserveAspectRatio="none">
      <path
        class="line-path"
        d="m0 0c0 15 0 35 25 35l2975-8"
        stroke="#f2f2f2"
        stroke-width="10"
        stroke-linecap="round"
        fill="none"
      />
      <path
        class="line-path moving-line"
        d="m0 0c0 15 0 35 25 35l2975-8"
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
      <h2>{$t.callforaction}</h2>
      <div class="qr-container">
        <a href="{base}/poll" target="_blank">
          <img src="{base}/qr.png" alt="QR Code" class="qr-img" /></a
        >
      </div>
    </div>
  </div>
</div>

<footer>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="switch {$lang === 'de' ? 'active' : ''}"
    on:click={() => ($lang === "en" ? setLang("de") : setLang("en"))}
    style="background-image: url('{$lang === 'en' ? 'de' : 'en'}.png')"
  >
    <div class="thumb"></div>
  </div>
  <span>{$t.made}</span>
  <a href="https://svelte.dev" target="_blank" class="footer-img">
    <img src="{base}/svelte.png" alt="svelteLogo" />
  </a>
  <a href="https://firebase.google.com" target="_blank" class="footer-img">
    <img src="{base}/firebase.png" alt="firebaseLogo" />
  </a>
  <a href="https://github.com" target="_blank" class="footer-img">
    <img src="{base}/github.png" alt="githubLogo" />
  </a>
  <span>{$t.at}</span>
  <a href="https://vis.cs.rptu.de/" target="_blank" class="footer-img">
    <img src="{base}/heikeLogo.png" alt="heikeLogo" />
  </a>
  <a href="https://rptu.de" target="_blank" class="footer-img footer-img--rptu">
    <img src="{base}/rptuLogo.png" alt="rptuLogo" />
  </a>
  <DeleteVotes {db} />
</footer>

<div class="animate-moving-line animate-document"></div>

<style>
  :root {
    --vis-min-width: 100px;
    --vis-max-width: 700px;
    --doc-delay: 4s;
    --doc-update: 10s;
  }

  :global(body) {
    margin: 0;
  }

  .page {
    margin: 0 2.5vw;
    margin-top: 0.5vw;
  }

  .switch {
    height: 70%;
    aspect-ratio: 1.6/1;
    margin-right: auto;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 99999px;
    position: relative;
    cursor: pointer;
    transition: background-color 0.3s ease;
    box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.2);
  }
  .thumb {
    height: 90%;
    aspect-ratio: 1;
    border-radius: 50%;
    background-color: #fff;
    position: absolute;
    top: 5%;
    left: 4%;
    transition: left 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  .switch.active .thumb {
    left: 40%;
  }

  .qr-container {
    width: 100%;
    aspect-ratio: 2 / 1;
    position: relative;
  }
  .qr-img {
    /* height: 6vw; */
    height: 95%;
    width: auto;
    margin: 0 auto;
    display: block;
  }

  .headline {
    font-family: "Inter", "Segoe UI", Arial, sans-serif;
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
    height: 1.5vw;
    position: relative;
    margin: 0 2.5vw;
  }

  .update-line {
    position: absolute;
    left: 0;
    top: -45%;
    width: 100%;
    height: 100%;
  }

  .animate-moving-line {
    stroke-dasharray: 3025;
    animation: draw-line var(--doc-update) ease-in-out forwards;
  }

  @keyframes draw-line {
    10%,
    40% {
      stroke-dashoffset: 3025;
    }
    0%,
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
    margin: 0.5vw 0;
  }

  :global(.vis-component) {
    min-width: var(--vis-min-width);
    max-width: var(--vis-max-width);
    background-color: #f8fafc;
    border-radius: 1vw;
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
    display: flex;
    align-items: center;
  }
  .footer-img img {
    height: 100%;
  }
  .footer-img--rptu img {
    height: 75%;
  }
</style>
