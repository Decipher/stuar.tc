<template>
  <b-navbar type="dark" variant="dark">
    <b-navbar-brand>SCVR</b-navbar-brand>
    <b-nav is-nav-bar>
      <b-nav-item v-if="layers.length > 1" @click='close'>Back</b-nav-item>
    </b-nav>
  </b-navbar>
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    computed: {
      ...mapState({
        layers: state => state.layers.index
      })
    },

    methods: {
      close () {
        this.$store.commit('layers/remove')
      }
    }
  }
</script>

<style scoped>
  nav {
    z-index: 10;
  }
</style>
