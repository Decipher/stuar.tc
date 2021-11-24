<template>
  <div>
    <DuiHero>
      <h1 class="mb-20 text-6xl font-bold" v-text="entity.attributes.title" />
      <!-- Date badge -->
      <DuiBadge class="mb-3">
        {{ $moment(entity.attributes.created).format("YYYY.MM.DD") }}
      </DuiBadge>

      <!-- Category badge -->
      <DuiBadge class="mb-5" type="primary">{{
        entity.included.find((o) => o.type === "taxonomy_term--blog").attributes
          .name
      }}</DuiBadge>

      <!-- Description -->
      <div
        class="prose text-2xl mb-10"
        v-html="entity.attributes.field_description.processed"
      />

      <!-- First paragraph -->
      <!-- <div
        class="prose"
        v-html="content[0].attributes.field_text_formatted.processed"
      /> -->
      <div class="prose">
        <slot name="field_content" />
      </div>

    </DuiHero>
  </div>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'
export default {
  mixins: [DruxtEntityMixin],
  computed: {
    content: ({ entity }) => entity.relationships.field_content.data.map(({ id }) => entity.included.find((o) => o.id === id))
  },
  druxt: {
    query: {
      include: ['field_blog_category', 'field_content'],
      fields: [
        ['created', 'field_blog_category', 'field_content', 'field_description', 'path', 'title'],
        ['taxonomy_term--blog', ['name']]
      ]
    }
  }
}
</script>
