<script>
  import { onMount, tick } from "svelte";
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
  let ballsRef;
  let gaugesRef;
  let mapRef;

  onMount(() => {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    const unsubscribe = onSnapshot(
      collection(db, "votes"),
      async (snapshot) => {
        oldVotes = currentVotes;
        currentVotes = snapshot.docs.map((doc) => doc.data());
        const newestVote =
          currentVotes
            .filter((v) => v.time)
            .sort((a, b) => b.time - a.time)[0] || null;
        await tick();
        console.log("got new Votes:", currentVotes);
        if (oldVotes.length == 0) {
          ballsRef.draw(currentVotes);
          gaugesRef.draw(currentVotes);
          mapRef.draw(currentVotes);
          mapRef.update(currentVotes, newestVote);
          ballsRef.update(currentVotes, newestVote);
          gaugesRef.update(currentVotes, newestVote);
        } else {
          console.log("starting delay");
          delay(5000);
          console.log("ending delay");
          ballsRef.update(currentVotes, newestVote);
          gaugesRef.update(currentVotes);
          mapRef.update(currentVotes, newestVote);
        }
      },
    );
    // cleanup if component is destroyed
    return () => unsubscribe();
  });
</script>

<h1 class="headline">See Beyond the Numbers</h1>
<h2 class="headline">Watch Your Data Come to Life</h2>
<div class="vis-grid">
  <Map bind:this={mapRef} />

  <Balls bind:this={ballsRef} />

  <Gauges bind:this={gaugesRef} />
</div>

<style>
  :root {
    --vis-min-width: 100px;
    --vis-max-width: 500px;
  }

  .headline {
    display: block;
    text-align: left;
    margin: 10px;
  }
  h2.headline {
    font-weight: normal;
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
    font-size: clamp(0.9rem, 2vw + 0.2rem, 2.5rem);
  }
  :global(h2) {
    text-align: center;
    font-size: clamp(0.9rem, 2vw + 0rem, 2.5rem);
    margin-bottom: 0.5rem;
  }

  :global(.vis-component svg) {
    display: block;
  }
</style>
