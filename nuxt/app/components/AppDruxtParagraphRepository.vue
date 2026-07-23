<script setup lang="ts">
import type { Paragraph } from '~/utils/druxtParagraph'

const props = defineProps<{ paragraph: Extract<Paragraph, { type: 'repository' }> }>()

const gitpodUrl = computed(() => `https://gitpod.io/#${props.paragraph.url}`)

// Only offer a sponsor link for repos Stuart actually maintains (his own
// GitHub account, or one of the Druxt project orgs) — not every repository
// card links to something he can accept sponsorship for.
const SPONSOR_ELIGIBLE_GITHUB_OWNERS = ['decipher', 'druxt', 'druxt-contrib']
const SPONSOR_URL = 'https://github.com/sponsors/Decipher'

const sponsorUrl = computed(() => {
  const owner = props.paragraph.url.match(/^https?:\/\/github\.com\/([^/]+)/i)?.[1]?.toLowerCase()
  return owner && SPONSOR_ELIGIBLE_GITHUB_OWNERS.includes(owner) ? SPONSOR_URL : undefined
})
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-default bg-muted px-6 py-5.5">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="prose prose-lg max-w-none text-[15px] leading-relaxed dark:prose-invert prose-code:bg-elevated prose-code:text-highlighted prose-code:font-medium prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none" v-html="paragraph.description" />
    <div class="mt-4 flex flex-wrap gap-2.5">
      <UButton
        :to="paragraph.url"
        target="_blank"
        rel="noopener"
        icon="i-lucide-github"
        label="View source ↗"
        color="neutral"
        variant="outline"
        class="text-muted hover:border-inverted"
      />
      <UButton
        v-if="paragraph.gitpod"
        :to="gitpodUrl"
        target="_blank"
        rel="noopener"
        icon="i-lucide-external-link"
        label="Open in Gitpod ↗"
        color="neutral"
        variant="outline"
        class="text-muted hover:border-inverted"
      />
      <UButton
        v-if="paragraph.drupalUrl"
        :to="paragraph.drupalUrl"
        target="_blank"
        rel="noopener"
        icon="i-simple-icons-drupal"
        label="View on Drupal.org ↗"
        color="neutral"
        variant="outline"
        class="text-muted hover:border-inverted"
      />
      <UButton
        v-if="sponsorUrl"
        :to="sponsorUrl"
        target="_blank"
        rel="noopener"
        icon="i-simple-icons-githubsponsors"
        label="Sponsor ↗"
        color="neutral"
        variant="outline"
        class="text-muted hover:border-primary hover:text-primary"
        :ui="{ leadingIcon: 'text-primary' }"
      />
    </div>
  </div>
</template>
