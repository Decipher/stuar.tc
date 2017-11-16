<template>
  <b-navbar type="dark" variant="dark">
    <b-navbar-brand>SCVR</b-navbar-brand>
    <b-nav is-nav-bar>
      <b-nav-item v-if="$route.name !== 'index'" @click='back'>Home</b-nav-item>
    </b-nav>
  </b-navbar>
</template>

<script>
  export default {
    methods: {
      back () {
        this.$router.push('/')
      }
    }
  }
</script>

<style scoped>
  nav {
    z-index: 10;
  }
</style>
