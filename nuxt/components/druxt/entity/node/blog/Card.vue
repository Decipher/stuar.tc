<template>
  <DuiCard
    v-if="entity.attributes.path"
    :title="entity.attributes.title"
    :to="entity.attributes.path.alias"
  >
    <div class="flex gap-1">
      <!-- Date badge -->
      <DuiBadge class="mb-3" size="sm">
        {{ $moment(entity.attributes.created).format('YY.MM.DD') }}
      </DuiBadge>

      <!-- Category badge -->
      <DuiBadge class="mb-5" size="sm" type="primary">{{ entity.included.find((o) => o.type === 'taxonomy_term--blog').attributes.name }}</DuiBadge>
    </div>
    <div class="prose" v-html="entity.attributes.field_description.processed" />
  </DuiCard>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'
export default {
  mixins: [DruxtEntityMixin],
  druxt: {
    query: {
      include: ['field_blog_category'],
      fields: [
        ['created', 'field_blog_category', 'field_description', 'path', 'title'],
        ['taxonomy_term--blog', ['name']]
      ]
    }
  }
}
</script>
