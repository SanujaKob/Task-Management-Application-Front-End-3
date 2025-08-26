<!-- src/pages/CreateUser.vue -->
<template>
  <div class="page">
    <main class="hero">
      <h1>Create a New User</h1>
      <p>Enter the User’s details and save.</p>
      <br></br>

      <v-form v-model="isValid" @submit.prevent="handleSubmit" validate-on="blur">
        <div class="grid">
          <v-text-field
            v-model="form.first_name"
            label="First Name"
            :rules="[rules.required]"
            required
          />
          <v-text-field
            v-model="form.last_name"
            label="Last Name"
            :rules="[rules.required]"
            required
          />

          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            :rules="[rules.required, rules.email]"
            required
          />

          <v-select
            v-model="form.role"
            :items="roles"
            label="Role"
            :rules="[rules.required]"
            required
          />

          <v-text-field
            v-model="form.password"
            label="Password"
            type="password"
            :rules="[rules.required, rules.min8]"
            required
          />
          <v-text-field
            v-model="form.confirm_password"
            label="Confirm Password"
            type="password"
            :rules="[rules.required, rules.matchPassword(form.password)]"
            required
          />
        </div>

        <div class="actions">
          <v-btn type="submit" color="black" variant="flat" :disabled="submitting || !isValid">
            <template v-if="!submitting">Create User</template>
            <template v-else>Saving…</template>
          </v-btn>
          <v-btn variant="outlined" @click="resetForm" :disabled="submitting">Reset</v-btn>
        </div>

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
      </v-form>
    </main>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

const isValid = ref(false)
const submitting = ref(false)

const roles = ['Admin', 'Manager', 'Employee']

const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  role: '',
  password: '',
  confirm_password: '',
})

const rules = {
  required: v => (!!v || v === 0) || 'This field is required',
  email: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email',
  min8: v => (v && v.length >= 8) || 'Must be at least 8 characters',
  matchPassword: (pw) => (v) => v === pw || 'Passwords must match',
}

const message = reactive({ type: 'success', text: '' })

function resetForm() {
  form.first_name = ''
  form.last_name = ''
  form.email = ''
  form.role = ''
  form.password = ''
  form.confirm_password = ''
  message.text = ''
}

async function handleSubmit() {
  const payload = {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    role: form.role,
    password: form.password,
  }

  submitting.value = true
  message.text = ''
  try {
    // If you don't have a Vite proxy, use the full URL (e.g., http://localhost:8000/api/users)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    resetForm()
    message.type = 'success'
    message.text = 'User created successfully.'
  } catch (err) {
    message.type = 'error'
    message.text = 'Failed to create user. Check your backend or network.'
  } finally {
    submitting.value = false
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
.hero {
  margin: 40px auto;
  padding: 0 16px;
  text-align: center; /* centered header + paragraph */
}
.hero h1 { font-size: clamp(24px, 4vw, 32px); margin-bottom: 6px; }
.hero p  { color: #111; margin: 0 0 20px; }

/* form grid */
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
  text-align: left;
}
@media (max-width: 700px) {
  .grid { grid-template-columns: 1fr; }
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
}
</style>
