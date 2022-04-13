<template>
  <div class="flex flex-col h-screen">
    <DuiNavbar :title="config.site_name" class="-mb-16" />
    <Nuxt class="flex-1 overflow-y-auto" />
  </div>
</template>

<script>
import ConfigMixin from '~/mixins/config'

export default {
  mixins: [ConfigMixin],

  head() {
    return {
      link: [
        {
          rel: 'alternate',
          type: 'application/rss+xml',
          href: '/blog.xml',
        },
      ],
    }
  },
}
</script>
