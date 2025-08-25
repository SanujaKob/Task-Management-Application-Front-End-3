<template>
  <div class="loading" role="status" aria-live="polite">
    <div class="spinner"></div>
    <h1>ABACUS Consulting</h1>
    <h2>Task Management Application</h2>
    <p>Loading application…</p>
  </div>
</template>

<style scoped>
.loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;   /* full viewport width */
  height: 100vh;  /* full viewport height */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #111;
  color: #fff;
  text-align: center;
  font-family: system-ui, sans-serif;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #fff;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
