<script>
  import { goto } from "$app/navigation";
</script>

<div class="main-menu">
  <button class="main-btn" on:click={() => goto("/poll")}>Go to Poll</button>
  <button class="main-btn" on:click={() => goto("/vis")}
    >See Visualization</button
  >
</div>

<style>
  .main-menu {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    gap: 3rem;
    background: linear-gradient(120deg, #e6f0ff 0%, #f8fafc 100%);
  }

  .main-btn {
    width: 80vw;
    max-width: 500px;
    height: 20vh;
    min-height: 120px;
    font-size: 2.2rem;
    font-weight: bold;
    border: none;
    border-radius: 2rem;
    background: #4f8cff;
    color: #fff;
    box-shadow: 0 4px 24px #0002;
    cursor: pointer;
    transition:
      background 0.2s,
      transform 0.1s;
  }

  .main-btn:hover,
  .main-btn:focus {
    background: #2a5db0;
    transform: scale(1.03);
    outline: none;
  }
</style>
