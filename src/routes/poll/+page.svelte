<script>
  import { initializeApp } from "firebase/app";
  import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import LocSelect from "$lib/LocSelect.svelte";
  import EmojiPicker from "$lib/EmojiPicker.svelte";

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

  let minutesSinceFive = 0; // 0 to 240 (4 hours)
  const step = 1; // in minutes

  function formatTime(minutes) {
    const totalMinutes = 5.5 * 60 + minutes;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute.toString().padStart(2, "0")}h`;
  }

  const sendVote = async (vote) => {
    // set current time
    vote.time = new Date();
    vote.emoji = EmojiPickRef.getEmoji();
    // fill with random emoji if not provided
    if (vote.emoji === "") {
      const possibleEmojis = Array.from(
        { length: 0x1f64f - 0x1f600 + 1 },
        (_, i) => String.fromCodePoint(0x1f600 + i),
      );
      vote.emoji =
        possibleEmojis[Math.floor(Math.random() * possibleEmojis.length)];
    }
    // set location
    const loc = LocSelectRef.getLocation();
    if (loc) {
      vote.location.name = loc.name;
      vote.location.lat = loc.lat;
      vote.location.lon = loc.lon;
    }
    // set date
    const totalMinutes = 5.5 * 60 + minutesSinceFive;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    vote.getuptime = new Date(2025, 0, 1, hour, minute);
    console.log("Vote sent:", vote);
    const voteDict = Object.keys(vote).reduce((acc, key) => {
      acc[key] = vote[key];
      return acc;
    }, {});
    try {
      await addDoc(collection(db, "votes"), voteDict);
      // alert("Vote recorded!");
    } catch (e) {
      console.error("Error adding vote: ", e);
    }
  };

  const vote = {
    time: new Date(),
    idol: "Superhero",
    timetravel: "Past",
    emoji: "",
    drinks: [],
    location: {
      name: "",
      lat: 0,
      lon: 0,
    },
    getuptime: new Date(2025, 0, 1, 5, 30),
    breakfast: "Sweet",
  };
  const timetravelList = ["Past", "Future"];
  const idolList = ["Superhero", "Wizard"];
  const drinkList = ["Coffee", "Tea", "Juice", "Water"];
  const breakfastList = ["Sweet", "Salty", "Nothing"];

  let LocSelectRef = null;
  let EmojiPickRef = null;
</script>

<div class="content-container">
  <h1>Visualize Your Data</h1>

  <div class="question-container">
    <div class="question-content">
      <h3>Where are you from?</h3>
      <LocSelect bind:this={LocSelectRef} />
    </div>
  </div>

  <div class="question-container">
    <div class="question-content">
      <h3>Would you rather be a superhero or a wizard?</h3>
      {#each idolList as option}
        <label>
          <input
            type="radio"
            name="idols"
            value={option}
            bind:group={vote.idol}
          />
          {option}
        </label>
      {/each}
    </div>
  </div>

  <div class="question-container">
    <div class="question-content">
      <h3>What is your favorite emoji?</h3>
      <EmojiPicker bind:this={EmojiPickRef} />
    </div>
  </div>

  <div class="question-container">
    <div class="question-content">
      <h3>What do you like to drink?</h3>
      {#each drinkList as drink}
        <label>
          <input type="checkbox" value={drink} bind:group={vote.drinks} />
          {drink}
        </label>
      {/each}
    </div>
  </div>

  <div class="question-container">
    <div class="question-content">
      <h3>Would you rather travel to the past or the future?</h3>
      {#each timetravelList as option}
        <label>
          <input
            type="radio"
            name="timetravel"
            value={option}
            bind:group={vote.timetravel}
          />
          {option}
        </label>
      {/each}
    </div>
  </div>

  <div class="question-container">
    <div class="question-content">
      <h3>When did you get up today?</h3>
      <label>
        <input
          type="range"
          min="0"
          max="210"
          {step}
          bind:value={minutesSinceFive}
        />
        {formatTime(minutesSinceFive)}
      </label>
    </div>
  </div>

  <div class="question-container">
    <div class="question-content">
      <h3>What did you eat for breatfast?</h3>
      {#each breakfastList as option}
        <label>
          <input
            type="radio"
            name="breakfast"
            value={option}
            bind:group={vote.breakfast}
          />
          {option}
        </label>
      {/each}
    </div>
  </div>

  <button on:click={() => sendVote(vote)}>Submit</button>
</div>

<style>
  :root {
    --box-padding: 18px;
    --box-radius: 16px;
    --box-bg: #f8fafc;
    --box-shadow: 0 4px 24px 0 #0001, 0 1.5px 4px #0001;
    --accent: #4f8cff;
    --accent-light: #e6f0ff;
    --accent-dark: #2a5db0;
    --text-main: #222;
    --text-muted: #666;
    --button-bg: var(--accent);
    --button-bg-hover: var(--accent-dark);
    --button-text: #fff;
    --button-radius: 8px;
    --button-shadow: 0 2px 8px #0002;
    --input-radius: 6px;
    --input-border: #c9d6e3;
    --input-focus: var(--accent);
  }

  .content-container {
    font-family: "Inter", "Segoe UI", Arial, sans-serif;
    background: #f4f7fb;
    color: var(--text-main);
    margin: 0;
    padding: 0;
  }

  .content-container {
    max-width: 480px;
    margin: 2.5rem auto 2rem auto;
    padding: 1.5rem;
    background: #fff;
    border-radius: 24px;
    box-shadow: 0 8px 32px #0001;
  }

  h1 {
    text-align: center;
    font-size: 2.2rem;
    margin-bottom: 2.2rem;
    color: var(--accent-dark);
    letter-spacing: 0.01em;
  }

  .question-container {
    background-color: var(--box-bg);
    border-radius: var(--box-radius);
    margin: 1.2rem 0;
    box-shadow: var(--box-shadow);
    transition: box-shadow 0.2s;
  }

  .question-container:hover {
    box-shadow:
      0 8px 32px 0 #4f8cff22,
      0 2px 8px #0001;
  }

  .question-content {
    padding: var(--box-padding);
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  h3 {
    margin-top: 0;
    margin-bottom: 1.1rem;
    font-size: 1.18rem;
    color: var(--accent-dark);
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    margin-right: 1.2em;
    margin-bottom: 0.7em;
    font-size: 1rem;
    cursor: pointer;
    color: var(--text-main);
    user-select: none;
  }

  input[type="radio"],
  input[type="checkbox"] {
    width: 1.1em;
    height: 1.1em;
    accent-color: var(--accent);
    margin-right: 0.4em;
    border-radius: 50%;
    border: 1.5px solid var(--input-border);
    transition: border 0.2s;
  }

  input[type="range"] {
    width: 60%;
  }

  :global(input[type="text"]),
  :global(.input-options) {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5em 0.9em;
    border-radius: var(--input-radius);
    border: 1.5px solid var(--input-border);
    font-size: 1.1rem;
    margin-bottom: 0.2em;
    transition: border 0.2s;
    background: #fff;
    color: var(--text-main);
  }

  :global(input[type="text"]:focus),
  :global(.autocomplete-list li:hover) {
    border-color: var(--input-focus);
    border-radius: calc(0.7 * var(--input-radius));
    outline: none;
    background: var(--accent-light);
  }

  button {
    display: block;
    width: 100%;
    margin: 2.2rem auto 0 auto;
    padding: 0.9em 0;
    background: var(--button-bg);
    color: var(--button-text);
    border: none;
    border-radius: var(--button-radius);
    font-size: 1.15rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--button-shadow);
    letter-spacing: 0.01em;
    transition:
      background 0.18s,
      box-shadow 0.18s;
  }

  button:hover,
  button:focus {
    background: var(--button-bg-hover);
    box-shadow: 0 6px 24px #4f8cff33;
    outline: none;
  }

  /* Responsive adjustments */
  @media (max-width: 600px) {
    .content-container {
      max-width: 98vw;
      padding: 0.7rem;
      border-radius: 12px;
    }
    h1 {
      font-size: 1.3rem;
    }
    h3 {
      font-size: 1rem;
    }
    button {
      font-size: 1rem;
      padding: 0.7em 0;
    }
  }
</style>
