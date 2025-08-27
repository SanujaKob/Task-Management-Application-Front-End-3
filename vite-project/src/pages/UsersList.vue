<!-- src/pages/UsersList.vue -->
<template>
  <div class="page">
    <main class="hero">
      <h1>All Users</h1>
      <p>Browse, edit, and remove users.</p>

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

          <v-card-actions class="card-actions">
            <v-btn size="small" variant="text" @click="openEdit(u)">Edit</v-btn>
            <v-btn size="small" variant="text" color="error" @click="confirmDelete(u)">Delete</v-btn>
          </v-card-actions>
        </v-card>

        <div v-if="users.length === 0" class="empty">No users found.</div>
      </div>
    </main>

    <!-- Edit dialog -->
    <v-dialog v-model="editOpen" max-width="520">
      <v-card>
        <v-card-title>Edit User</v-card-title>
        <v-card-text v-if="draft" class="grid gap-3">
          <v-text-field v-model="draft.first_name" label="First Name" />
          <v-text-field v-model="draft.last_name" label="Last Name" />
          <v-text-field v-model="draft.email" label="Email" type="email" />
          <v-select :items="roles" v-model="draft.level" label="User Level" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editOpen = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteOpen" max-width="440">
      <v-card>
        <v-card-title>Delete user</v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <b>{{ toDelete?.first_name }} {{ toDelete?.last_name }}</b> (ID: {{ toDelete?.id ?? toDelete?.user_id }})?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteOpen = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="performDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const USE_MOCK = true

const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const users = ref([])

const editOpen = ref(false)
const draft = ref(null)

/** FIXED LEVELS */
const roles = ['Admin', 'Manager', 'Employee']

const deleteOpen = ref(false)
const toDelete = ref(null)

/* Mock users */
const mockUsers = [
  { id: 'U-101', first_name: 'Sanuja', last_name: 'Kobbekaduwe', level: 'Admin',    email: 'sanuja@abacus.lk' },
  { id: 'U-102', first_name: 'Jane',   last_name: 'Doe',         level: 'Manager',  email: 'jane@abacus.lk' },
  { id: 'U-103', first_name: 'Ashen',  last_name: 'Perera',      level: 'Employee', email: 'ashen@abacus.lk' },
  { id: 'U-104', first_name: 'Nuwan',  last_name: 'Silva',       level: 'Employee', email: 'nuwan@abacus.lk' },
  { id: 'U-105', first_name: 'Kavinda',last_name: 'Fernando',    level: 'Manager',  email: 'kavinda@abacus.lk' },
]

onMounted(async () => {
  try {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400))
      users.value = mockUsers
    } else {
      const res = await fetch('/api/users', { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      users.value = await res.json()
    }
  } catch (e) {
    error.value = 'Failed to load users.'
  } finally {
    loading.value = false
  }
})

function openEdit(u) {
  draft.value = { ...u }
  editOpen.value = true
}

async function saveEdit() {
  if (!draft.value) return
  saving.value = true
  const payload = { ...draft.value }

  const idx = users.value.findIndex(x => (x.id ?? x.user_id) === (payload.id ?? payload.user_id))
  const prev = idx !== -1 ? { ...users.value[idx] } : null
  if (idx !== -1) users.value[idx] = { ...users.value[idx], ...payload }

  try {
    if (!USE_MOCK) {
      const id = encodeURIComponent(payload.id ?? payload.user_id)
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Update failed')
    }
    editOpen.value = false
  } catch (e) {
    if (idx !== -1 && prev) users.value[idx] = prev
  } finally {
    saving.value = false
  }
}

function confirmDelete(u) {
  toDelete.value = u
  deleteOpen.value = true
}

async function performDelete() {
  if (!toDelete.value) return
  deleting.value = true
  const id = toDelete.value.id ?? toDelete.value.user_id
  const prev = [...users.value]
  users.value = users.value.filter(u => (u.id ?? u.user_id) !== id)

  try {
    if (!USE_MOCK) {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
    }
    deleteOpen.value = false
    toDelete.value = null
  } catch (e) {
    users.value = prev
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.page { width: 100%; max-width: 1200px; margin: 0 auto; color: #000; font-family: "Poppins", system-ui, sans-serif; }
.hero { margin: 40px auto; padding: 0 16px; text-align: center; }
.hero h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: 6px; }
.hero p  { color: #111; margin: 0 0 20px; }

.grid-5 { display: grid; grid-template-columns: repeat(5, minmax(220px, 1fr)); gap: 16px; margin-top: 12px; text-align: left; }
@media (max-width: 1200px){ .grid-5 { grid-template-columns: repeat(4, minmax(220px, 1fr)); } }
@media (max-width: 992px) { .grid-5 { grid-template-columns: repeat(3, minmax(220px, 1fr)); } }
@media (max-width: 720px) { .grid-5 { grid-template-columns: repeat(2, minmax(200px, 1fr)); } }
@media (max-width: 520px) { .grid-5 { grid-template-columns: 1fr; } }

.user-card { border-radius: 12px; }
.row { display: flex; justify-content: space-between; gap: 10px; margin: 6px 0; }
.label { color: #555; font-size: 12px; text-transform: uppercase; letter-spacing: .3px; }
.value { font-weight: 600; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }

.card-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 0; }
.status { text-align: center; padding: 12px; color: #333; }
.status.error { color: #b00020; }
.empty { grid-column: 1 / -1; text-align: center; color: #666; padding: 16px; }
.grid { display: grid; gap: 12px; }
</style>
