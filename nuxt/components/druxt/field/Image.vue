<template>
  <DruxtEntity class="mx-4" type="file--file" :uuid="model.data.id">
    <template #default="{ entity }">
      <img
        v-if="($nuxt.context || {}).isDev"
        class="w-full rounded-2xl"
        :src="entity.attributes.uri.url"
      />
      <NuxtImg v-else class="w-full rounded-2xl" :src="ipxFix(entity)" />
    </template>
  </DruxtEntity>
</template>

<script>
import { DruxtFieldMixin } from 'druxt-entity'
export default {
  mixins: [DruxtFieldMixin],
  methods: {
    ipxFix(entity) {
      return [this.$druxt.settings.baseUrl, entity.attributes.uri.url].join('/')
    },
  },
}
</script>
