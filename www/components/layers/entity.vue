<template>
  <a-entity>
    <a-image
      v-if="typeof entity.included[0] !== 'undefined'"

      :src="`#img-${entity.included[0].id}`"
      :width="entity.data.relationships.field_photo_files.data[0].meta.width * (32 / entity.data.relationships.field_photo_files.data[0].meta.height)"

      height="32"
    ></a-image>
  </a-entity>
</template>

<script>
  export default {
    data () {
      return {
        entity: null
      }
    },

    mounted () {
      return this.$store.dispatch('api/get', {
        endpoint: '/jsonapi/node/photo/' + this.data.uuid + '?include=field_photo_files,field_photo_files.image,field_photo_files.image.file--file&fields[field_photo_files]=image&fields[file--file]=url',
        callback: (res) => {
          this.entity = res.data
          this.$store.commit('assets/add', {
            type: 'img',
            src: this.$store.state.api.url + this.entity.included[0].attributes.url,
            uuid: this.entity.included[0].id
          })
        }
      })
    },

    props: ['data', 'delta']
  }
</script>
