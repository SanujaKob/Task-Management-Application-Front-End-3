<template>
  <div class="page">
    <main class="hero">
      <h1>My Profile</h1>
      <p>View and update your personal details.</p>
      <br></br>

      <v-form v-model="isValid" @submit.prevent="handleSave" validate-on="blur">
        <div class="grid">
          <v-text-field v-model="form.first_name" label="First Name" :readonly="!editing"
                        :rules="[rules.required]" required />
          <v-text-field v-model="form.last_name" label="Last Name" :readonly="!editing"
                        :rules="[rules.required]" required />

          <v-text-field v-model="form.email" label="Email" type="email" readonly
                        :rules="[rules.required, rules.email]" required />

          <v-text-field v-model="form.role" label="Role" readonly />
        </div>

        <div class="actions">
          <v-btn v-if="!editing" color="black" variant="flat" @click="startEditing" :disabled="saving">Edit</v-btn>
          <template v-else>
            <v-btn type="submit" color="black" variant="flat" :disabled="saving || !isValid">
              <template v-if="!saving">Save</template>
              <template v-else>Saving…</template>
            </v-btn>
            <v-btn variant="outlined" @click="cancelEditing" :disabled="saving">Cancel</v-btn>
          </template>
        </div>

        <v-alert v-if="message.text" :type="message.type" variant="tonal" class="mt-4" closable
                 @click:close="message.text = ''">
          {{ message.text }}
        </v-alert>

        <div v-if="loading" class="status">Loading profile…</div>
        <div v-else-if="error" class="status error">{{ error }}</div>
      </v-form>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'

const isValid = ref(false)
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const error = ref('')

const form = reactive({
  first_name: '', last_name: '', email: '', phone: '', role: ''
})
const original = reactive({ ...form })
const message = reactive({ type: 'success', text: '' })

const rules = {
  required: v => (!!v || v === 0) || 'This field is required',
  email: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email',
}

function startEditing() { editing.value = true; message.text = '' }
function cancelEditing() { Object.assign(form, original); editing.value = false; message.text = '' }

onMounted(async () => {
  try {
    // Use full URL if no Vite proxy: http://localhost:8000/api/users/me
    const res = await fetch('/api/users/me', { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    Object.assign(form, data)
    Object.assign(original, form)
  } catch (e) {
    error.value = 'Failed to load profile.'
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  saving.value = true
  message.text = ''
  error.value = ''
  try {
    // Send only editable fields (adjust to your API)
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
    }
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const updated = await res.json()
    Object.assign(form, updated)
    Object.assign(original, form)
    editing.value = false
    message.type = 'success'
    message.text = 'Profile updated.'
  } catch (e) {
    message.type = 'error'
    message.text = 'Failed to save profile. Check your backend or network.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  background: #fff;
  color: #000;
  font-family: "Poppins", system-ui, sans-serif;
}
.hero { margin: 40px auto; padding: 0 16px; text-align: center; }
.hero h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: 6px; }
.hero p  { color: #111; margin: 0 0 20px; }

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
  text-align: left;
}
@media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }

.actions {
  display: flex; gap: 12px; margin-top: 16px; justify-content: center;
}
.status { text-align: center; padding: 12px; color: #333; }
.status.error { color: #b00020; }
</style>
