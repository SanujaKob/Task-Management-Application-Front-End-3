<script setup>
import MyTaskDashboard from '../components/MyTaskDashboard.vue'
import MyTasksBreakdown from '../components/MyTasksBreakdown.vue'
</script>

<template>
  <div class="page">
    <main class="hero">
      <h1>Stay on top of your tasks</h1>
      <p>Simple, fast task management - create tasks, track progress, and hit deadlines.</p>

      <!-- Dashboard (mock mode while backend is off) -->
      <section class="home">
        <MyTaskDashboard disableFetch />
      </section>

      <!-- Breakdown panels -->
      <section class="home">
        <MyTasksBreakdown />
      </section>
    </main>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: #ffffff;
  color: #000000;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  font-family: "Poppins", system-ui, sans-serif;
}
.hero {
  max-width: 960px;
  margin: 40px auto;
  padding: 0 16px;
  text-align: center;
}
.hero h1 {
  font-size: clamp(24px, 4vw, 32px);
  margin-bottom: 10px;
}
.hero p {
  color: #111;
  margin: 0 auto 20px;
  max-width: 600px;
}
/* Optional page cards (unrelated to dashboard) */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 20px;
}
.card {
  background: #ffffff;
  border: 1px solid #e7e8ec;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.card h3 { margin: 0 0 6px; }
.card p { margin: 0; color: #111; }
</style>
