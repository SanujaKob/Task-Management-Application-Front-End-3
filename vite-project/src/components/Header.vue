<!-- src/components/Header.vue -->
<style scoped>
.nav { position: sticky; top: 0; z-index: 10; width: 100vw; background: #ffffff; border-bottom: 1px solid #e5e7eb; }
.nav > .container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 15px 8px; box-sizing: border-box; }
.brand { font-weight: 700; }
nav { display: flex; align-items: center; flex-wrap: wrap; }
.link { margin-left: 20px; text-decoration: none; color: #000; opacity: 0.9; }
.link.active, .link:hover { opacity: 1; text-decoration: underline; }
.logout-btn { margin-left: 24px; padding: 6px 14px; background: #000; color: #fff; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
.logout-btn:hover { background: #333; }
</style>

<template>
  <header class="nav">
    <div class="container">
      <div class="brand">ABACUS Task Management Application</div>

      <!-- Show nav only when authed -->
      <nav v-if="isAuthed">
        <RouterLink
          v-for="item in visibleLinks"
          :key="item.to"
          :to="item.to"
          class="link"
          :class="{ active: route.name === item.name }"
        >
          {{ item.label }}
        </RouterLink>

        <!-- Logout -->
        <button class="logout-btn" type="button" @click="onLogout">Log Out</button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getToken, getRole, logout as authLogout } from '@/services/auth';

const router = useRouter();
const route = useRoute();

const role = ref(getRole());
const isAuthed = computed(() => !!getToken());

// Single source of truth for menu items
const allLinks = [
  { to: '/',            name: 'home',        label: 'My Tasks' },                 // any authed user
  { to: '/tasks/new',   name: 'create-task', label: 'Create Task' },              // any authed user (change if needed)
  { to: '/team-tasks',  name: 'team-tasks',  label: 'Team Tasks', roles: ['manager', 'admin'] },
  { to: '/users',       name: 'users',       label: 'Users',      roles: ['admin'] },
  { to: '/users/new',   name: 'create-user', label: 'Create User', roles: ['admin'] },
  { to: '/profile',     name: 'profile',     label: 'My Profile' },               // any authed user
];

const visibleLinks = computed(() => {
  if (!isAuthed.value) return [];
  const r = role.value;
  return allLinks.filter(i => !i.roles || (r && i.roles.includes(r)));
});

function refreshRole() {
  role.value = getRole();
}

async function onLogout() {
  try {
    // Clear auth
    authLogout();
    localStorage.removeItem('me');

    // Navigate to login
    await router.replace({ name: 'login' });
  } catch (e) {
    console.error('Logout navigation failed', e);
    window.location.href = '/login';
  }
}

// Keep role in sync across tabs/windows
onMounted(() => {
  window.addEventListener('storage', refreshRole);
});
onBeforeUnmount(() => {
  window.removeEventListener('storage', refreshRole);
});
</script>
