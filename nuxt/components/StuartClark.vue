<template>
  <div class="md:pl-8">
    <Gravatar
      class="max-w-sm rounded-lg shadow-2xl w-full"
      :hash="config.social.gravatar"
      :size="600"
    />
    <!-- @TODO - Social links -->
    <div class="flex gap-4 mx-auto w-100 py-4">
      <a :href="`https://drupal.org/u/${config.social.drupal}`">
        <LogoDrupal class="h-10 w-10" />
      </a>
      <a :href="`https://github.com/${config.social.github}`">
        <LogoGithub class="h-10 w-10" />
      </a>
      <a :href="`https://twitter.com/${config.social.twitter}`">
        <LogoTwitter class="h-10 w-10" />
      </a>
    </div>
  </div>
</template>

<script>
import Gravatar from 'vue-gravatar'
import ConfigMixin from '~/mixins/config'

export default {
  components: { Gravatar },
  mixins: [ConfigMixin],
}
</script>
