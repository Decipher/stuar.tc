<template>
  <div class="container mx-auto my-32">
    <div class="prose">
      <h2 v-text="entity.attributes.field_title" />
    </div>

    <!-- Top -->
    <div v-if="top">
      <DruxtEntity
        v-for="child of top"
        :key="child.id"
        :type="child.type"
        :uuid="child.id"
      />
    </div>

    <div v-if="first || second" class="md:flex">
      <!-- First -->
      <div class="md:flex-grow">
        <DruxtEntity
          v-for="child of first"
          :key="child.id"
          :type="child.type"
          :uuid="child.id"
        />
      </div>

      <!-- Second -->
      <div class="md:flex-grow">
        <DruxtEntity
          v-for="child of second"
          :key="child.id"
          :type="child.type"
          :uuid="child.id"
        />
      </div>
    </div>

    <!-- Bottom -->
    <div v-if="bottom">
      <DruxtEntity
        v-for="child of bottom"
        :key="child.id"
        :type="child.type"
        :uuid="child.id"
      />
    </div>
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

  computed: {
    top: ({ children }) =>
      children.filter(
        (o) => o.attributes.behavior_settings.layout_paragraphs.region === 'top'
      ),
    first: ({ children }) =>
      children.filter(
        (o) =>
          o.attributes.behavior_settings.layout_paragraphs.region === 'first'
      ),
    second: ({ children }) =>
      children.filter(
        (o) =>
          o.attributes.behavior_settings.layout_paragraphs.region === 'second'
      ),
    bottom: ({ children }) =>
      children.filter(
        (o) =>
          o.attributes.behavior_settings.layout_paragraphs.region === 'bottom'
      ),
  },
}
</script>
