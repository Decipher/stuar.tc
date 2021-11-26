<template>
  <div class="card h-full flex lg:card-side bordered shadow hover:shadow-lg">
    <div class="card-body">
      <h2 class="card-title" v-text="title" />
      <slot />
      <div class="card-actions">
        <NuxtLink :to="to" class="btn btn-primary">Open post</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    mini: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    }
  }
}
</script>
