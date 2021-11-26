<template>
  <DruxtRouter :path="route" />
</template>

<script>
export default {
  props: {
    path: {
      type: String,
      default: undefined
    }
  },
  computed: {
    route: ({ $route, path }) => path || $route.fullPath
  }
}
</script>
