<template>
  <a-entity :id="`photo--${entity.id}`">
    <scvr-camera
      :id="`photo--${entity.id}`"
      :look="is360" />

    <a-entity v-if="!is360" :rotation="entityRot">
      <a-entity :position="entityPos">

        <!-- Title. -->
        <scvr-text align="center" position="0 17.5 0" width="64">{{ entity.title }}</scvr-text>

        <!-- Frame. -->
        <a-plane
          :width="entity.image.meta.width * (32 / entity.image.meta.height) + .5"

          height="32.5"
          material="side: double; color: #000;"
          position="0 0 -0.05" />

        <!-- Image. -->
        <a-image
          :src="`#img--${entity.image.id}--large`"
          :width="entity.image.meta.width * (32 / entity.image.meta.height)"

          height="32" />

      </a-entity>
    </a-entity>

    <a-entity v-else>
      <a-sky
        :src="`#img--${entity.image.id}--large`" />
    </a-entity>
  </a-entity>
</template>

<script>
  import { mapMutations, mapState } from 'vuex'

  export default {
    computed: {
      entity () {
        return this.index[this.$route.params.id]
      },

      is360 () {
        return this.entity.title.includes('360')
      },

      ...mapState({
        index: state => state.index,
        responsive: state => state.responsive
      })
    },

    data () {
      return {
        entityPos: false,
        entityRot: false
      }
    },

    fetch ({ app, store, params }) {
      if (typeof store.state.index[params.id] === 'undefined') {
        return store.dispatch('api/get', {
          endpoint: 'node/photo/' + params.id,
          callback: (res) => {
            store.dispatch('index', [res])
          }
        })
      }
    },

    methods: {
      // Entity - Position.
      entityCalc () {
        this.entityRot = false

        switch (true) {
          // VR.
          case this.responsive.vr.active:
            this.entityPos = '0 0 -25'
            this.entityRot = `0 0 0`
            break

          // XS.
          case this.responsive.breakpoint === 'xs':
            this.entityPos = '0 0 0'
            break

          // >= SM.
          default:
            this.entityPos = `0 0 -20`
        }
      },

      // Stored methods.
      ...mapMutations({
        assetsAdd: 'assets/add',
        cameraSet: 'camera/set'
      })
    },

    mounted () {
      this.cameraSet(`photo--${this.entity.id}`)
      // Store original WASD controls state.
      // this.wasdOrig = this.index.wasdControls

      // Add the item thumbnail asset.
      this.assetsAdd({
        type: 'img',
        src: this.entity.image.url.large,
        uuid: this.entity.image.id,
        modifier: 'large'
      })

      this.entityCalc()
    },

    watch: {
      'responsive.changed': [
        'entityCalc'
      ]
    }
  }
</script>