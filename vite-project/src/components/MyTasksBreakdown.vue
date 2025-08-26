<template>
  <div>
    <br />
    <v-expansion-panels v-model="panel" :disabled="disabled" multiple>
      <v-expansion-panel>
        <v-expansion-panel-title><b>To Do</b></v-expansion-panel-title>
        <v-expansion-panel-text>Some content</v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title><b>In Progress</b></v-expansion-panel-title>
        <v-expansion-panel-text>Some content</v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title><b>Completed</b></v-expansion-panel-title>
        <v-expansion-panel-text>Some content</v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title><b>Approved</b></v-expansion-panel-title>
        <v-expansion-panel-text>Some content</v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title><b>Rejected</b></v-expansion-panel-title>
        <v-expansion-panel-text>Some content</v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title><b>Re-Submission</b></v-expansion-panel-title>
        <v-expansion-panel-text>Some content</v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const panel = ref([0])   // open the first panel by default
const disabled = ref(false)
</script>
