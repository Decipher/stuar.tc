<template>
  <a-entity
    v-if="layers.length > 0"

    id="layers">
    <scvr-layer
      v-for="({type, data}, delta) in layers"

      :data="data"
      :delta="delta"
      :key="`layer-${delta}`"
      :type="type"
    ></scvr-layer>
  </a-entity>
</template>

<script>
  import { Deserializer } from 'jsonapi-serializer'

  // Import the layer management component.
  import scvrLayer from '~/components/layer.vue'

  export default {
    // Register the layer management component.
    components: { scvrLayer },

    computed: {
      // Return the layers from the layers store.
      layers () {
        return this.$store.state.layers.index
      }
    },

    // Fetch index data.
    fetch ({ app, store, params }) {
      // GET /api/node/photo.
      return app.$waterwheel.jsonapi.get('node/photo', {
        fields: {
          'file--file': 'url',
          'node--photo': 'title,field_image'
        },
        include: 'field_image'
      })

        // Deserialize / Normalize the data.
        .then(res => new Deserializer({
          keyForAttribute: 'camelCase',

          // Transforms.
          transform: function (record) {
            record['image'] = record['fieldImage']
            delete record['fieldImage']
            return record
          },

          // Relationships.
          'file--file': {
            valueForRelationship: function (relationship, included) {
              return {
                id: relationship.id,
                url: included.url,
                meta: relationship.meta
              }
            }
          }
        })

          // Deserialize.
          .deserialize(res, (err, data) => {
            if (!err) {
              return data
            }
          }))

        // Store data.
        .then(res => {
          store.dispatch('index', res)
        })

        // Set layers.
        .then(res => {
          store.commit('layers/reset')
          store.commit('layers/add', { type: 'index' })
        })
    }
  }
</script>
