<template>
  <a-entity id="index">
    <scvr-entity-teaser
      v-for="(entity, uuid, delta) in $store.state.index"

      :delta="delta"
      :disabled="disabled"
      :entity="entity"
      :key="uuid"
      :position="position(delta)"
    ></scvr-entity-teaser>
    <a-text
      align="center"
      color="black"
      font="fonts/Roboto-msdf.json"
      value="Index"
      position="27.5 9.6 0"
      rotation="0 0 -90"
      width="100"
      material="fog: true"
    ></a-text>
  </a-entity>
</template>

<script>
  import scvrEntityTeaser from '~/components/entity.teaser.vue'

  export default {
    components: {
      scvrEntityTeaser
    },

    computed: {
      disabled () {
        return this.delta !== 0
      }
    },

    methods: {
      position (delta) {
        let row = -Math.floor(delta / 3)
        let col = delta % 3

        return `${(col - 1) * (16 + 1)} ${(row - 1) * (9 + 1) + 20} 0`
      }
    },

    props: ['data', 'delta']
  }
</script>
