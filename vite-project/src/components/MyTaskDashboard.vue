<template>
  <section class="dashboard" aria-label="Task status summary">
    <div class="cards-7">
      <div v-for="c in categories" :key="c.key" class="stat-card">
        <div class="stat-title">Number of Tasks — {{ c.label }}</div>
        <div class="stat-value">{{ counts[c.key] ?? 0 }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
const categories = [
  { key: 'todo',         label: 'To Do' },
  { key: 'in_progress',  label: 'In Progress' },
  { key: 'over_due',     label: 'Over Due' },
  { key: 'completed',    label: 'Completed' },
  { key: 'approved',     label: 'Approved' },
  { key: 'rejected',     label: 'Rejected' },
  { key: 'resubmission', label: 'Re-Submission' },
]

// temporary mock data
const counts = {
  todo: 0,
  in_progress: 0,
  over_due: 0,
  completed: 0,
  approved: 0,
  rejected: 0,
  resubmission: 0,
}
</script>

<style scoped>
.dashboard { 
  margin: 24px auto;
  display: flex;
  justify-content: center;
}

.cards-7 {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 16px;
  max-width: 1200px;   /* keeps them centered in a row */
  justify-content: center;
}

.stat-card {
  background: #fff;
  border: 1px solid #e7e8ec;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  text-align: center;   /* center text inside */
  min-width: 140px;
}
.stat-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .3px;
  color: #444;
  margin-bottom: 6px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  color: #000;
}
</style>
