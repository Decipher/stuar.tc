<script setup lang="ts">
const { githubStat, drupalStat, npmStat } = useOSSProfiles()
</script>

<template>
  <SCEcosystemPane>
    <template #profiles>
      <SCProfileRow
        name="GitHub"
        handle="@Decipher"
        :stat="githubStat ?? '150+ repos'"
        href="https://github.com/Decipher"
      >
        <template #logo><img src="/github.svg" alt="" class="size-5"></template>
      </SCProfileRow>
      <SCProfileRow
        name="Drupal.org"
        handle="deciphered"
        :stat="drupalStat ?? '~30 modules'"
        href="https://www.drupal.org/u/deciphered"
      >
        <template #logo><img src="/drupal.svg" alt="" class="size-5"></template>
      </SCProfileRow>
      <SCProfileRow
        name="npm"
        handle="~deciphered"
        :stat="npmStat ?? '25+ packages'"
        href="https://www.npmjs.com/~deciphered"
      >
        <template #logo><img src="/npm.svg" alt="" class="h-3"></template>
      </SCProfileRow>
    </template>
    <template #support>
      <SCSponsorCard />
    </template>
  </SCEcosystemPane>
</template>
