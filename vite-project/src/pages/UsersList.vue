<!-- src/pages/UsersList.vue ------->
<template>
  <div class="page">
    <main class="hero">
      <h1>All Users</h1>
      <p>Browse, edit, and remove users.</p>

      <div v-if="loading" class="status">Loading users…</div>
      <div v-else-if="error" class="status error">{{ error }}</div>

      <div v-else class="grid-4">
        <v-card
          v-for="u in users"
          :key="u.id"
          class="user-card"
          variant="outlined"
        >
          <v-card-text>
            <div class="row"><span class="label">Full Name</span><span class="value">{{ u.full_name ?? '-' }}</span></div>
            <div class="row"><span class="label">Username</span><span class="value">{{ u.username ?? '-' }}</span></div>
            <div class="row"><span class="label">Email</span><span class="value">{{ u.email ?? '-' }}</span></div>
            <div class="row"><span class="label">Role</span><span class="value">{{ prettyRole(u.role) }}</span></div>
            <div class="row"><span class="label">User ID</span><span class="value mono">{{ u.id ?? '-' }}</span></div>
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
          <v-text-field v-model="draft.full_name" label="Full Name" />
          <v-text-field v-model="draft.username" label="Username" />
          <v-text-field v-model="draft.email" label="Email" type="email" />
          <v-select :items="roleLabels" v-model="draft.roleLabel" label="Role" />
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
          <b>{{ toDelete?.full_name }}</b> (ID: {{ toDelete?.id }})?
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

const USE_MOCK = false  // ← set true to use mock data

const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const users = ref([])

const editOpen = ref(false)
const draft = ref(null)

const roleLabels = ['Admin', 'Manager', 'Employee']
const roleMapToEnum = { Admin: 'admin', Manager: 'manager', Employee: 'employee' }
const enumToRoleLabel = { admin: 'Admin', manager: 'Manager', employee: 'Employee' }

const deleteOpen = ref(false)
const toDelete = ref(null)

const mockUsers = [
  { id: 'U-101', full_name: 'Sanuja Kobbekaduwe', username: 'sanuja', email: 'sanuja@abacus.lk', role: 'admin' },
  { id: 'U-102', full_name: 'Jane Doe',            username: 'jane',   email: 'jane@abacus.lk',   role: 'manager' },
  { id: 'U-103', full_name: 'Ashen Perera',        username: 'ashen',  email: 'ashen@abacus.lk',  role: 'employee' },
  { id: 'U-104', full_name: 'Nuwan Silva',         username: 'nuwan',  email: 'nuwan@abacus.lk',  role: 'employee' },
  { id: 'U-105', full_name: 'Kavinda Fernando',    username: 'kavi',   email: 'kavi@abacus.lk',   role: 'manager' },
]

const prettyRole = (r) => enumToRoleLabel[r] ?? r ?? '-'

onMounted(async () => {
  try {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
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
  draft.value = {
    id: u.id,
    full_name: u.full_name,
    username: u.username,
    email: u.email,
    roleLabel: enumToRoleLabel[u.role] ?? '',
  }
  editOpen.value = true
}

async function saveEdit() {
  if (!draft.value) return
  saving.value = true

  const original = users.value.find(x => x.id === draft.value.id) || {}
  const maybe = {
    full_name: draft.value.full_name?.trim(),
    username: draft.value.username?.trim(),
    email: draft.value.email?.trim(),
    role: roleMapToEnum[draft.value.roleLabel] ?? null,
  }
  const payload = {}
  for (const [k, v] of Object.entries(maybe)) {
    if (v !== undefined && v !== null && v !== original[k]) payload[k] = v
  }
  if (Object.keys(payload).length === 0) { editOpen.value = false; saving.value = false; return }

  const idx = users.value.findIndex(x => x.id === draft.value.id)
  const previous = idx !== -1 ? { ...users.value[idx] } : null

  if (idx !== -1) users.value[idx] = { ...users.value[idx], ...payload }

  try {
    if (!USE_MOCK) {
      const res = await fetch(`/api/users/${encodeURIComponent(draft.value.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        if (idx !== -1 && previous) users.value[idx] = previous
        let msg = `Update failed (HTTP ${res.status})`
        try {
          const data = await res.json()
          if (data?.detail) msg = Array.isArray(data.detail) ? data.detail.map(d => d.msg || d).join(', ') : data.detail
        } catch {}
        throw new Error(msg)
      } else {
        const updated = await res.json()
        if (idx !== -1) users.value[idx] = updated
      }
    }
    editOpen.value = false
  } catch (e) {
    error.value = e.message || 'Update failed.'
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
  const id = toDelete.value.id
  const prev = [...users.value]
  users.value = users.value.filter(u => u.id !== id)

  try {
    if (!USE_MOCK) {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
    }
    deleteOpen.value = false
    toDelete.value = null
  } catch (e) {
    users.value = prev
    error.value = e.message || 'Delete failed.'
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

/* --- Grid layout: 4 cards per row --- */
.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(260px, 1fr));
  gap: 20px;
  margin-top: 20px;
  text-align: left;
}

@media (max-width: 1200px){ .grid-4 { grid-template-columns: repeat(3, minmax(240px, 1fr)); } }
@media (max-width: 900px)  { .grid-4 { grid-template-columns: repeat(2, minmax(220px, 1fr)); } }
@media (max-width: 600px)  { .grid-4 { grid-template-columns: 1fr; } }

/* --- Card styling: bigger, more padded --- */
.user-card {
  border-radius: 16px;
  padding: 12px;
  min-height: 220px;
}

.row { display: flex; justify-content: space-between; gap: 10px; margin: 8px 0; }
.label { color: #555; font-size: 12px; text-transform: uppercase; letter-spacing: .3px; }
.value { font-weight: 600; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }

.card-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }
.status { text-align: center; padding: 12px; color: #333; }
.status.error { color: #b00020; }
.empty { grid-column: 1 / -1; text-align: center; color: #666; padding: 16px; }
.grid { display: grid; gap: 12px; }
</style>
