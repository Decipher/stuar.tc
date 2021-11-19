<template>
  <div class="card lg:card-side bordered">
    <div class="card-body">
      <h2 class="card-title" v-text="title" />
      <slot />
      <div class="card-actions">
        <NuxtLink :to="to" tag="button" class="btn btn-primary">Open post</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
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
