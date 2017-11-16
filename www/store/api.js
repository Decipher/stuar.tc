import { Deserializer } from 'jsonapi-serializer'

export const actions = {
  // @TODO - Build a layer on top of Waterwheel / JSON API serializer easier
  //         requests.
  get (state, { endpoint, callback }) {
    return this.$waterwheel.jsonapi.get(endpoint, {
      fields: {
        'file--file': 'filename',
        'node--photo': 'title,field_image'
      },
      include: 'field_image',
      _consumer_id: process.env.API_CONSUMER_CLIENT_ID
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
                large: `/images/large/${included.filename}`,
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
        return callback(res)
      })
  }
}
