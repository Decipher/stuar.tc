<template>
  <div class="bg-white navbar sticky text-white-content z-50">
    <div class="flex-1 px-2 mx-2">
      <NuxtLink to="/" class="text-lg font-bold" v-text="title" />
    </div>
    <div class="flex-none hidden px-2 mx-2 md:flex">
      <div class="flex items-stretch">
        <!-- Menu Items -->
      </div>
    </div>
    <div class="flex-none">
      <!-- @TODO - Make this work -->
      <!-- <button class="btn btn-square btn-ghost">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="inline-block w-6 h-6 stroke-current"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </button> -->
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
  },
}
</script>
