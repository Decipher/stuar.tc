<template>
  <div class="flex flex-col h-screen">
    <Nuxt class="flex-1 overflow-y-auto" />
  </div>
</template>

<script>
import ConfigMixin from '~/mixins/config'

export default {
  mixins: [ConfigMixin],
}
</script>
