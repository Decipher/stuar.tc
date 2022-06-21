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

      <template v-if="entity.included">
        <!-- Type badge -->
        <DuiBadge class="mb-5" size="sm" type="primary">{{
          entity.included.find((o) => o.type === 'taxonomy_term--article_type')
            .attributes.name
        }}</DuiBadge>

        <!-- Category badge -->
        <DuiBadge class="mb-5" size="sm" type="secondary">{{
          entity.included.find(
            (o) => o.type === 'taxonomy_term--article_category'
          ).attributes.name
        }}</DuiBadge>
      </template>
    </div>

    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="!mini" class="prose" v-html="description" />
  </DuiCard>

  <div v-else />
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
    description: ({ $md, fields }) =>
      ellipsize(
        $md.render(fields.field_description.data),
        fields.field_description.schema.settings.display.trim_length
      ),
  },

  druxt: {
    query: {
      include: ['field_article_category', 'field_article_type'],
      fields: [
        [
          'created',
          'field_article_category',
          'field_description',
          'path',
          'title',
        ],
        ['taxonomy_term--article_category', ['name']],
        ['taxonomy_term--article_type', ['name']],
      ],
    },
  },
}
</script>
