<template>
  <div class="my-32">
    <div class="container mx-auto">
      <div class="prose">
        <h2 v-text="entity.attributes.field_title" />
      </div>
    </div>

    <DruxtEntity
      v-for="child of children"
      :key="child.id"
      :type="child.type"
      :uuid="child.id"
    />
  </div>
</template>

<script>
export default {
  props: {
    children: {
      type: Array,
      required: true,
    },

    entity: {
      type: Object,
      required: true,
    },
  },
}
</script>
