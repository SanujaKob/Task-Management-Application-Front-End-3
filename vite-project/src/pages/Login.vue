<template>
  <div class="auth">
    <v-card class="auth-card" elevation="2">
      <v-card-title class="title">Welcome back</v-card-title>
      <v-card-subtitle class="subtitle">Sign in to continue</v-card-subtitle>

      <v-card-text>
        <v-form
          ref="form"
          v-model="isValid"
          validate-on="blur"
          @submit.prevent="handleLogin"
        >
          <!-- Username or Email -->
          <v-text-field
            v-model="usernameOrEmail"
            label="Username or email"
            autocomplete="username"
            :rules="[rules.required]"
            :disabled="loading"
            density="comfortable"
            required
          />

          <!-- Password -->
          <v-text-field
            v-model="password"
            :type="show ? 'text' : 'password'"
            label="Password"
            autocomplete="current-password"
            :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="show = !show"
            :rules="[rules.required, rules.min(8)]"
            :disabled="loading"
            density="comfortable"
            required
          />

          <div class="row">
            <v-checkbox
              v-model="remember"
              label="Remember me"
              density="comfortable"
              hide-details
              :disabled="loading"
            />
            <div class="spacer" />
          </div>

          <v-alert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            class="mt-2"
            closable
            @click:close="errorMsg = ''"
          >
            {{ errorMsg }}
          </v-alert>

          <v-btn
            type="submit"
            color="black"
            class="mt-4"
            block
            :loading="loading"
            :disabled="!isValid || loading"
          >
            Sign In
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
// ✅ use the new auth helpers we wrote
import { login, apiFetch } from '@/services/auth';

const router = useRouter();
const route = useRoute();

const form = ref(null);
const isValid = ref(false);
const loading = ref(false);
const show = ref(false);
const remember = ref(true);
const usernameOrEmail = ref('');
const password = ref('');
const errorMsg = ref('');

const rules = {
  required: v => (!!v || v === 0) || 'This field is required',
  min: n => v => !v || String(v).length >= n || `Minimum ${n} characters`,
};

async function handleLogin() {
  errorMsg.value = '';

  // Validate on submit
  const result = await form.value?.validate?.();
  if (result && result.valid === false) return;

  loading.value = true;
  try {
    // ✅ our login returns { token, role }
    const { token, role } = await login(
      usernameOrEmail.value.trim(),
      password.value,
      remember.value
    );
    if (!token) throw new Error('No token returned from server.');

    // Optional: cache /users/me for quick access
    try {
      const me = await apiFetch('/users/me');
      localStorage.setItem('me', JSON.stringify(me));
    } catch {
      // no-op; not fatal if /me is unavailable
    }

    // Debug: see what role was captured (remove later)
    // console.log('Logged in role:', role);

    // Support both ?next= and ?redirect=
    const next = route.query.next || route.query.redirect || '/';
    router.replace(String(next));
  } catch (e) {
    const msg = e?.message || '';
    errorMsg.value =
      /401|unauthor/i.test(msg) ? 'Invalid username or password' : msg || 'Sign-in failed';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth {
  min-height: calc(100dvh - 60px);
  display: grid;
  place-items: center;
  padding: 24px;
  background: #fafafa;
  color: #000;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  color: #000;
  border: 1px solid #ddd;
}
.title { font-weight: 700; color: #000; }
.subtitle { opacity: .8; color: #000; }
.row { display: flex; align-items: center; gap: 8px; margin-top: 4px; color: #000; }
.spacer { flex: 1; }
.forgot { font-size: .9rem; opacity: .9; color: #000; }
</style>
