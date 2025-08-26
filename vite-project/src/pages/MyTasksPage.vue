<!-- src/pages/MyTasksPage.vue -->
<template>
  <div class="page">
    <main class="hero">
      <h1>My Task Dashboard</h1>
      <p>
        Current Progress
      </p>

      <section class="cards">
        <article class="card">
          <h3>Create & Assign</h3>
          <p>Add tasks with priority, due dates, and assignees.</p>
        </article>
        <article class="card">
          <h3>Track Progress</h3>
          <p>Update status and % complete at a glance.</p>
        </article>
        <article class="card">
          <h3>Stay Notified</h3>
          <p>See what needs your attention first.</p>
        </article>
         <article class="card">
          <h3>Easy to Use</h3>
          <p>All your tasks in once place</p>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
// No script logic for now
</script>

<style scoped>
.page {
    /* No 100vh here */
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background: #ffffff;
  color: #000000;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* ✅ allow scrolling if content overflows */
    /* Allow the parent .content to control height */
}

/* Hero */
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

/* Buttons */
.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 28px;
}
.btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #000000;
  background: #000000;
  color: #ffffff;
  cursor: pointer;
}
.btn:hover { opacity: 0.85; }

/* Cards */
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
