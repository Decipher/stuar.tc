<template>
  <DruxtEntity v-if="!$fetchState.pending" v-bind="route.props" />
  <div v-else />
</template>

<script>
export default {
  data: () => ({
    route: undefined,
  }),
  async fetch() {
    const { route } = await this.$store.dispatch('druxtRouter/get', this.$route.fullPath)
    this.route = route
  },
}
</script>
