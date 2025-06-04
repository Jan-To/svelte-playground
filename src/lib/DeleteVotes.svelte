<script>
  import { onMount } from "svelte";
  import { getDocs, collection, deleteDoc, doc } from "firebase/firestore";

  let { db } = $props();
  let showDialog = $state(false);
  let inputPassword = $state("");
  let status = $state("");

  const correctPassword = "votes";

  async function deleteAllVotes() {
    const votesCollection = collection(db, "votes");
    const snapshot = await getDocs(votesCollection);

    const deletePromises = snapshot.docs.map((d) =>
      deleteDoc(doc(db, "votes", d.id)),
    );

    await Promise.all(deletePromises);
  }

  async function handleConfirm() {
    if (inputPassword === correctPassword) {
      status = "Deleting votes...";
      try {
        await deleteAllVotes();
        status = "All votes deleted successfully.";
      } catch (error) {
        console.error(error);
        status = "Error deleting votes.";
      }
    } else {
      status = "Incorrect password.";
    }
    showDialog = false;
    inputPassword = "";
  }
</script>

<div class="button-container">
  <button class="button" onclick={() => (showDialog = true)}>
    <span>&#8634</span>
  </button>
</div>

{#if showDialog}
  <div class="dialog-backdrop">
    <div class="dialog">
      <p>Enter password to delete all votes:</p>
      <input
        type="password"
        bind:value={inputPassword}
        placeholder="Enter password"
      />
      <div>
        <button onclick={handleConfirm}>Confirm</button>
        <button onclick={() => (showDialog = false)}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

{#if status}
  <p class="status">{status}</p>
{/if}

<style>
  p {
    font-size: medium;
  }

  .button-container {
    height: 75%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button {
    height: 100%;
    width: auto;
    aspect-ratio: 1 / 1;
    padding: 0;
    border: none;
    background-color: rgb(241, 241, 241);
    color: rgb(104, 104, 104);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  button span {
    font-size: clamp(0rem, 1.3vw, 50rem);
    transform: translateY(-5%);
  }

  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .dialog {
    background: white;
    padding: 1rem;
    border-radius: 6px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    min-width: 300px;
  }

  .dialog input {
    width: 90%;
    padding: 0.5rem;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }

  .dialog button {
    margin-right: 0.5rem;
    padding: 0.5rem 1rem;
  }

  .status {
    margin-top: 1rem;
    font-size: 0.9rem;
  }
</style>
