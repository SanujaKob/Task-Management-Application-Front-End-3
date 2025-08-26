<template>
  <v-app>
    <div class="shell">
      <Transition name="fade" mode="out-in">
        <!-- Loading screen only -->
        <LoadingPage v-if="loading" key="loading" />

        <!-- App layout after loading -->
        <div v-else key="app" class="layout">
          <Header />
          <main class="content">
            <!-- Render pages here; header/footer always visible -->
            <RouterView />
          </main>
          <Footer />
        </div>
      </Transition>
    </div>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from "vue";

import Header from "./components/Header.vue";
import Footer from "./components/Footer.vue";
import LoadingPage from "./pages/LoadingPage.vue";

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
  /* Use your font (Poppins). If not yet loaded, see step 3. */
  font-family: "Poppins", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
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
  flex: 1; /* keep footer stuck to bottom when content is short */
}

/* Fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
