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
  import { mapState } from 'vuex'

  export default {
    computed: {
      ...mapState({
        // Return the layers from the layers store.
        layers: state => state.layers.index
      })
    },

    // Fetch index data.
    //
    // @TODO - Build a layer on top of Waterwheel / JSON API serializer easier
    //         requests.
    fetch ({ app, store, params }) {
      // GET /api/node/photo.
      return app.$waterwheel.jsonapi.get('node/photo', {
        fields: {
          'file--file': 'filename',
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
                // Files are symbolically linked in place beween servers.
                url: {
                  _original: `/images/_original/${included.filename}`,
                  thumbnail: `/images/thumbnail/${included.filename}`
                },
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
