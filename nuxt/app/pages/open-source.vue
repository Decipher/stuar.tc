<script setup lang="ts">
import { projects } from '~/data/projects'
import { modules } from '~/data/modules'
import { activity } from '~/data/activity'
import { drupalcons } from '~/data/drupalcons'

useSeoMeta({
  title: 'Open source · stuar.tc',
  description: 'DruxtJS, File (Field) Paths, and the Druxt ecosystem.',
})
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-16 px-6 py-16 sm:px-10">
    <header>
      <SCEyebrow>// open source</SCEyebrow>
      <h1 class="mt-4 text-4xl font-bold tracking-tighter text-highlighted sm:text-5xl">
        Building the decoupled Drupal stack
      </h1>
      <p class="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        170+ contrib projects, 31,546 sites, and a Splash Award.
      </p>
    </header>

    <section class="space-y-5">
      <SCSectionHeader title="Selected work" />
      <div class="grid gap-4 md:grid-cols-3">
        <SCProjectCard
          v-for="p in projects"
          :key="p.name"
          :tag="p.tag"
          :name="p.name"
          :description="p.description"
          :meta="p.meta"
        />
      </div>
    </section>

    <section class="space-y-5">
      <SCSectionHeader title="Module installs" />
      <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-md border border-default bg-default p-6">
          <SCModuleRow
            v-for="m in modules"
            :key="m.machine"
            :name="m.name"
            :machine="m.machine"
            :installs="m.installs"
            :percent="m.percent"
          />
        </div>
        <div class="rounded-md border border-default bg-default p-6">
          <SCContributionHeatmap :weeks="18" />
        </div>
      </div>
    </section>

    <section class="space-y-5">
      <SCSectionHeader title="Recent activity" />
      <div class="rounded-md border border-default bg-default px-6 py-2">
        <SCActivityRow
          v-for="a in activity"
          :key="a.repo + a.when"
          :when="a.when"
          :repo="a.repo"
          :action="a.action"
        />
      </div>
    </section>

    <section class="space-y-5">
      <SCSectionHeader title="DrupalCons" />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SCDrupalConCard
          v-for="dc in drupalcons"
          :key="dc.year"
          :year="dc.year"
          :city="dc.city"
          :note="dc.note"
        />
      </div>
    </section>
  </div>
</template>
