<template>
  <div class="bg-accent py-16 my-8">
    <div class="container mx-auto px-4">
      <!-- eslint-disable vue/no-v-html -->
      <div
        v-if="description"
        class="prose mb-4 text-accent-content"
        v-html="description"
      />
      <!-- eslint-enable vue/no-v-html -->

      <!-- Link to repository -->
      <DuiButton :href="url" target="_blank"> See the code </DuiButton>

      <!-- Gitpod link. -->
      <DuiButton v-if="gitpod" :href="gitpod" target="_blank" theme="primary">
        Run in Gitpod
      </DuiButton>
    </div>
  </div>
</template>

<script>
import { DruxtEntityMixin } from 'druxt-entity'

export default {
  mixins: [DruxtEntityMixin],

  computed: {
    description: ({ entity }) =>
      (entity.attributes.field_description || {}).processed,

    /**
     * Is the repository hosted on Github?
     *
     * @type {boolean}
     */
    github: ({ url }) => url.includes('github.com'),

    /**
     * Is the repository Gitpod enabled?
     *
     * @type {boolean}
     */
    gitpod: ({ entity, url }) =>
      entity.attributes.field_gitpod ? `https://gitpod.io#${url}` : false,

    /**
     * The repository URL.
     *
     * @type {string}
     */
    url: ({ entity }) => entity.attributes.field_url.uri,
  },

  druxt: {
    query: {
      schema: true,
    },
  },
}
</script>

<style>
/* @TODO - Find better solution to this */
.bg-accent .prose h2 {
  @apply text-accent-content !important;
}
</style>
