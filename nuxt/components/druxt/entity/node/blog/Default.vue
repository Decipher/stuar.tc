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
    </DuiHero>

    <!-- Content paragraphs -->
    <slot name="field_content" />

    <!-- Giscus comments -->
    <div class="container mx-auto py-20 px-4">
      <script src="https://giscus.app/client.js"
        data-repo="Decipher/stuar.tc"
        data-repo-id="R_kgDOGZt96w"
        data-category="General"
        data-category-id="DIC_kwDOGZt9684CAB_7"
        data-mapping="pathname"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-theme="light"
        data-lang="en"
        crossorigin="anonymous"
        async>
      </script>
    </div>
  </div>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

export default {
  mixins: [DruxtEntityMixin],

  computed: {
    content: ({ entity }) => entity.relationships.field_content.data.map(({ id }) => entity.included.find((o) => o.id === id)),
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
