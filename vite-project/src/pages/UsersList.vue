<!-- src/pages/UsersList.vue -->
<template>
  <div class="page">
    <main class="hero">
      <h1>All Users</h1>
      <p>Browse the user directory.</p>

      <div v-if="loading" class="status">Loading users…</div>
      <div v-else-if="error" class="status error">{{ error }}</div>

      <div v-else class="grid-5">
        <v-card
          v-for="u in users"
          :key="u.id ?? u.user_id"
          class="user-card"
          variant="outlined"
        >
          <v-card-text>
            <div class="row"><span class="label">First Name</span><span class="value">{{ u.first_name ?? '-' }}</span></div>
            <div class="row"><span class="label">Last Name</span><span class="value">{{ u.last_name ?? '-' }}</span></div>
            <div class="row"><span class="label">User ID</span><span class="value mono">{{ u.id ?? u.user_id ?? '-' }}</span></div>
            <div class="row"><span class="label">User Level</span><span class="value">{{ u.level ?? u.role ?? '-' }}</span></div>
          </v-card-text>
        </v-card>

        <div v-if="users.length === 0" class="empty">No users found.</div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const loading = ref(true)
const error = ref('')
const users = ref([])

onMounted(async () => {
  try {
    const res = await fetch('/api/users', { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    users.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = 'Failed to load users.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page { width: 100%; max-width: 1200px; margin: 0 auto; color: #000; font-family: "Poppins", system-ui, sans-serif; }
.hero { margin: 40px auto; padding: 0 16px; text-align: center; }
.hero h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: 6px; }
.hero p  { color: #111; margin: 0 0 20px; }

.grid-5 { display: grid; grid-template-columns: repeat(5, minmax(180px, 1fr)); gap: 16px; margin-top: 12px; text-align: left; }
@media (max-width: 1200px){ .grid-5 { grid-template-columns: repeat(4, minmax(180px, 1fr)); } }
@media (max-width: 992px) { .grid-5 { grid-template-columns: repeat(3, minmax(180px, 1fr)); } }
@media (max-width: 720px) { .grid-5 { grid-template-columns: repeat(2, minmax(160px, 1fr)); } }
@media (max-width: 480px) { .grid-5 { grid-template-columns: 1fr; } }

.user-card { border-radius: 12px; }
.row { display: flex; justify-content: space-between; gap: 10px; margin: 6px 0; }
.label { color: #555; font-size: 12px; text-transform: uppercase; letter-spacing: .3px; }
.value { font-weight: 600; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }

.status { text-align: center; padding: 12px; color: #333; }
.status.error { color: #b00020; }
.empty { grid-column: 1 / -1; text-align: center; color: #666; padding: 16px; }
</style>
