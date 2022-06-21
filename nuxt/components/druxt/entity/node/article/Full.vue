<template>
  <div>
    <DuiHero>
      <h1 class="mb-20 text-6xl font-bold" v-text="entity.attributes.title" />
      <!-- Date badge -->
      <DuiBadge class="mb-3">
        {{ $moment(entity.attributes.created).format('YYYY.MM.DD') }}
      </DuiBadge>

      <!-- Category badge -->
      <DuiBadge v-if="entity.included" class="mb-5" type="primary">{{
        entity.included.find(
          (o) => o.type === 'taxonomy_term--article_category'
        ).attributes.name
      }}</DuiBadge>

      <!-- Description -->
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="prose text-2xl mb-10"
        v-html="$md.render(entity.attributes.field_description)"
      />
      <!-- eslint-enable vue/no-v-html -->
    </DuiHero>

    <!-- Content paragraphs -->
    <slot v-if="entity.included" name="field_content" />

    <!-- Giscus comments -->
    <div class="container mx-auto py-20 px-4">
      <!-- @todo - Move settings to Drupal via Config pages -->
      <script
        src="https://giscus.app/client.js"
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
        async
      ></script>
    </div>
  </div>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'
import Metatag from '~/mixins/metatag'

export default {
  mixins: [DruxtEntityMixin, Metatag],

  computed: {
    content: ({ entity }) =>
      entity.relationships.field_content.data.map(({ id }) =>
        entity.included.find((o) => o.id === id)
      ),
  },

  druxt: {
    query: {
      include: [
        'field_article_category',
        'field_article_type',
        'field_content',
      ],
      fields: [
        [
          'created',
          'field_blog_category',
          'field_content',
          'field_description',
          'metatag',
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
