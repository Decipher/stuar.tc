<template>
  <DuiCard
    v-if="entity.attributes.path"
    :title="entity.attributes.title"
    :to="entity.attributes.path.alias"
  >
    <div class="flex-grow flex gap-1">
      <!-- Date badge -->
      <DuiBadge class="mb-3" size="sm">
        {{ $moment(entity.attributes.created).format('YYYY.MM.DD') }}
      </DuiBadge>

      <!-- Category badge -->
      <DuiBadge class="mb-5" size="sm" type="primary">{{
        entity.included.find((o) => o.type === 'taxonomy_term--blog').attributes
          .name
      }}</DuiBadge>
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="!mini" class="prose" v-html="description" />
  </DuiCard>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'
import ellipsize from 'ellipsize'

export default {
  mixins: [DruxtEntityMixin],

  props: {
    mini: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    description: ({ fields }) =>
      ellipsize(
        fields.field_description.data.processed,
        fields.field_description.schema.settings.display.trim_length
      ),
  },

  druxt: {
    query: {
      include: ['field_blog_category'],
      fields: [
        [
          'created',
          'field_blog_category',
          'field_description',
          'path',
          'title',
        ],
        ['taxonomy_term--blog', ['name']],
      ],
    },
  },
}
</script>
