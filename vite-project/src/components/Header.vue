<!-- src/components/Header.vue -->
<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100vw;                  /* full width header */
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.nav > .container {
  max-width: 1200px;             /* fits laptop screens nicely */
  margin: 0 auto;                /* centers horizontally */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 1px;
  box-sizing: border-box;
}

.brand { font-weight: 700; }

.link {
  margin-left: 20px;
  text-decoration: none;
  color: #000;
  opacity: 0.9;
}
.link.active,
.link:hover {
  opacity: 1;
  text-decoration: underline;
}
</style>

<template>
  <header class="nav">
    <div class="container">
      <div class="brand">ABACUS Task Management Application</div>

      <nav>
        <!-- My Tasks (home) -->
        <RouterLink
          to="/"
          class="link"
          :class="{ active: $route.name === 'home' }"
        >
          My Tasks
        </RouterLink>

        <!-- Create Task -->
        <RouterLink
          to="/tasks/new"
          class="link"
          :class="{ active: $route.name === 'create-task' }"
        >
          Create Task
        </RouterLink>

        <!-- Team Tasks (placeholder until you create route) -->
        <a class="link" href="#">Team Tasks</a>

        <!-- Users -->
        <RouterLink
          to="/users"
          class="link"
          :class="{ active: $route.name === 'users' }"
        >
          Users
        </RouterLink>

        <!-- Create User -->
        <RouterLink
          to="/users/new"
          class="link"
          :class="{ active: $route.name === 'create-user' }"
        >
          Create User
        </RouterLink>

        <!-- My Profile -->
        <RouterLink
          to="/profile"
          class="link"
          :class="{ active: $route.name === 'profile' }"
        >
          My Profile
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<script setup>
// no script needed right now
</script>
