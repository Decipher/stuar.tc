<template>
  <DruxtEntity type="file--file" :uuid="model.data.id">
    <template #default="{ entity }">
      <NuxtImg :src="src(entity)" />
    </template>
  </DruxtEntity>
</template>

<script>
import { DruxtFieldMixin } from 'druxt-entity'
export default {
  mixins: [DruxtFieldMixin],
  methods: {
    src(entity) {
      return [this.$druxt.settings.baseUrl, entity.attributes.uri.url].join('/')
    },
  },
}
</script>
