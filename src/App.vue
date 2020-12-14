<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  mounted() {
    console.log(chrome.extension.getURL("popup.html"));
  }
};
</script>
