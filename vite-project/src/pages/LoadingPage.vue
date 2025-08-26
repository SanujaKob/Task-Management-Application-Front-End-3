<template>
  <div class="loading-screen" role="status" aria-live="polite">
    <h1>ABACUS Consulting</h1>
    <p>Loading Task Management Application...</p>
  </div>
</template>

<script setup></script>

<style scoped>
.loading-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;           /* full height as you had */
  background: #111;            /* black background */
  color: #fff;                 /* white text */
  font-family: "Poppins", system-ui, sans-serif;
  text-align: center;
  padding: 24px;
}

@media (prefers-reduced-motion: no-preference) {
  .loading-screen {
    opacity: 0;
    animation: fadeIn 300ms ease-out forwards;
  }
  @keyframes fadeIn { to { opacity: 1; } }
}
</style>
