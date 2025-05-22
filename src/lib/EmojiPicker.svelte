<script>
  import { onMount } from "svelte";
  let showEmojiPicker = false;
  let emoji = "";

  export function getEmoji() {
    return emoji;
  }

  onMount(async () => {
    if (!isMobile) {
      await import("emoji-picker-element");
    }
  });

  // Simple mobile check
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  function handleEmojiClick(event) {
    emoji = event.detail.unicode;
    showEmojiPicker = false;
  }

  function handleBlur(event) {
    // Delay to allow click event to register before closing dropdown
    setTimeout(() => {
      showEmojiPicker = false;
    }, 100);
  }
</script>

<div style="display: flex; gap: 0.5em; align-items: center;">
  <input
    type="text"
    placeholder="Enter an emoji"
    readonly={!isMobile}
    bind:value={emoji}
    on:focus={() => {
      if (!isMobile) showEmojiPicker = true;
    }}
    on:blur={handleBlur}
  />
  {#if showEmojiPicker && !isMobile}
    <emoji-picker
      style="position: absolute; z-index: 10;"
      on:emoji-click={handleEmojiClick}
    ></emoji-picker>
  {/if}
</div>
