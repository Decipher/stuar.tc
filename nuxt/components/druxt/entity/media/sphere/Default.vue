<template>
  <div class="my-8">
    <ClientOnly>
      <a-scene class="container h-96 mx-auto" embedded>
        <a-sky :src="src" />
      </a-scene>
    </ClientOnly>
  </div>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

// Import A-Frame library client-side only.
if (process.client) require('aframe')

export default {
  mixins: [DruxtEntityMixin],

  computed: {
    file: ({ entity }) => entity.included.find((o) => o.type === 'file--file'),
    src: ({ $druxt, file }) =>
      '/_ipx/_/' + $druxt.options.baseUrl + file.attributes.uri.url,
  },

  druxt: {
    query: {
      fields: [['field_media_image'], ['file--file', ['uri']]],
      include: ['field_media_image'],
    },
  },
}
</script>
