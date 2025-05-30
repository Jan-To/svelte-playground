<script>
  import { base } from "$app/paths";
  function handleClick() {
    window.open(`${base}/poll`, "_blank"); // open in new tab
    window.location.href = `${base}/vis`; // navigate current tab
  }
</script>

<div class="main-menu">
  <button class="main-btn" on:click={handleClick}>
    Go to Poll
    <img src="{base}/qr.png" alt="QR Code" class="qr-img" />
  </button>
  <a class="main-btn" href="{base}/vis">See Visualization</a>
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
    display: flex;
    justify-content: center;
    align-items: center;
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
    text-decoration: none;
    transition:
      background 0.2s,
      transform 0.1s,
      box-shadow 0.2s;
    text-align: center;
    letter-spacing: 0.01em;
  }

  .main-btn:hover,
  .main-btn:focus {
    background: #2a5db0;
    transform: scale(1.03);
    outline: none;
    box-shadow: 0 8px 32px #4f8cff33;
  }

  .qr-img {
    height: 3em;
    width: 3em;
    object-fit: contain;
    background: #fff;
    border-radius: 0.5em;
    box-shadow: 0 2px 8px #0001;
    margin-left: 0.5em;
  }
</style>
