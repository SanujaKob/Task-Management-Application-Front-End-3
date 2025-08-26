<!-- src/pages/MyProfile.vue -->
<template>
  <div class="page">
    <main class="hero">
      <h1>My Profile</h1>
      <p>View and update your personal details.</p>
      <br />

      <v-form v-model="isValid" @submit.prevent="handleSave" validate-on="blur">
        <!-- Basic details -->
        <div class="grid">
          <v-text-field
            v-model="form.first_name"
            label="First Name"
            :readonly="!editing"
            :rules="[rules.required]"
            required
          />
          <v-text-field
            v-model="form.last_name"
            label="Last Name"
            :readonly="!editing"
            :rules="[rules.required]"
            required
          />

          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            :readonly="!editing"
            :rules="[rules.required, rules.email]"
            required
          />

          <v-text-field
            v-model="form.phone"
            label="Phone"
            :readonly="!editing"
          />

          <v-text-field
            v-model="form.role"
            label="Role"
            :readonly="!editing"
          />
        </div>

        <!-- Password section (only in edit mode) -->
        <template v-if="editing">
          <v-divider class="my-6" />
          <h3 class="section-title">Change Password</h3>
          <p class="section-hint">Leave these empty if you don’t want to change your password.</p>

          <div class="grid">
            <v-text-field
              v-model="form.current_password"
              :type="show.current ? 'text' : 'password'"
              label="Current Password"
              :append-inner-icon="show.current ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="show.current = !show.current"
              :rules="[passwordRules.currentRequiredIfChanging]"
            />
            <v-text-field
              v-model="form.new_password"
              :type="show.new ? 'text' : 'password'"
              label="New Password"
              :append-inner-icon="show.new ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="show.new = !show.new"
              :rules="[passwordRules.minLength, passwordRules.notSameAsCurrent]"
              hint="Minimum 8 characters"
              persistent-hint
            />
            <v-text-field
              v-model="form.confirm_password"
              :type="show.confirm ? 'text' : 'password'"
              label="Confirm New Password"
              :append-inner-icon="show.confirm ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="show.confirm = !show.confirm"
              :rules="[passwordRules.confirmMatches]"
            />
          </div>
        </template>

        <!-- Actions -->
        <div class="actions">
          <v-btn
            v-if="!editing"
            color="black"
            variant="flat"
            @click="startEditing"
            :disabled="saving || loading"
          >Edit</v-btn>

          <template v-else>
            <v-btn type="submit" color="black" variant="flat" :disabled="saving || !isValid">
              <template v-if="!saving">Save</template>
              <template v-else>Saving…</template>
            </v-btn>
            <v-btn variant="outlined" @click="cancelEditing" :disabled="saving">Cancel</v-btn>
          </template>
        </div>

        <!-- Messages -->
        <v-alert
          v-if="message.text"
          :type="message.type"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="message.text = ''"
        >
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
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  role: '',
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const original = reactive({ ...form })
const message = reactive({ type: 'success', text: '' })
const show = reactive({ current: false, new: false, confirm: false })

const rules = {
  required: v => (!!v || v === 0) || 'This field is required',
  email: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email',
}

const passwordRules = {
  currentRequiredIfChanging: () =>
    !form.new_password || !!form.current_password || 'Enter your current password',
  minLength: () =>
    !form.new_password || form.new_password.length >= 8 || 'Minimum 8 characters',
  confirmMatches: () =>
    !form.new_password || form.confirm_password === form.new_password || 'Passwords do not match',
  notSameAsCurrent: () =>
    !form.new_password || form.current_password === '' || form.current_password !== form.new_password || 'New password must be different',
}

function startEditing() {
  editing.value = true
  message.text = ''
}

function cancelEditing() {
  Object.assign(form, { ...original, current_password: '', new_password: '', confirm_password: '' })
  editing.value = false
  message.text = ''
}

onMounted(async () => {
  try {
    const res = await fetch('/api/users/me', { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    Object.assign(form, data)
    Object.assign(original, { ...form, current_password: '', new_password: '', confirm_password: '' })
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
    // 1) Update profile fields
    const profilePayload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim?.() || '',
      role: form.role?.trim?.() || '', // remove if role must not be edited
    }
    const profileRes = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(profilePayload),
    })
    if (!profileRes.ok) throw new Error(`Profile HTTP ${profileRes.status}`)
    const updated = await profileRes.json()
    Object.assign(form, updated)
    Object.assign(original, { ...form, current_password: '', new_password: '', confirm_password: '' })

    // 2) Change password if requested
    if (form.new_password) {
      const pwRes = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          current_password: form.current_password,
          new_password: form.new_password,
        }),
      })
      if (!pwRes.ok) throw new Error(`Password HTTP ${pwRes.status}`)
    }

    // clear password fields
    form.current_password = ''
    form.new_password = ''
    form.confirm_password = ''

    editing.value = false
    message.type = 'success'
    message.text = 'Profile updated.'
  } catch (e) {
    message.type = 'error'
    message.text = 'Failed to save. Check your inputs and try again.'
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

.section-title { text-align: left; margin: 0 0 4px; font-weight: 600; }
.section-hint  { text-align: left; margin: 0 0 12px; color: #555; font-size: 0.9rem; }

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
