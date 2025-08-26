<template>
  <div class="shell">
    <Transition name="fade" mode="out-in">
      <!-- Loading screen only -->
      <LoadingPage v-if="loading" key="loading" />

      <!-- App layout after loading -->
      <div v-else key="app" class="layout">
        <Header />
        <main class="content">
          <!-- HomePage in 'embedded' mode so header/footer are visible -->
          <HomePage :embedded="true" />
        </main>
        <Footer />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
import LoadingPage from "./pages/LoadingPage.vue";
import HomePage from "./pages/MyTasksPage.vue";

const loading = ref(true);

onMounted(() => {
  setTimeout(() => {
    loading.value = false;
  }, 1200); // demo delay
});
</script>

<style>
html, body, #app { height: 100%; }
body {
  margin: 0;
  background: #ffffff;
  color: #000000;
  font-family: system-ui, sans-serif;
}

.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Layout after loading */
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1; /* make footer stick to bottom when content is short */
}

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
