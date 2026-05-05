<template>
  <search-page />
</template>

<script setup>
import SearchPage from './views/SearchPage.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f7fa;
}

#app {
  width: 100%;
  min-height: 100vh;
}
</style>
