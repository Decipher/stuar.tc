<script setup lang="ts">
import { modules as staticModules } from '~/data/modules'

type Filter = 'all' | 'drupal' | 'co-maint' | 'npm'

const { modules: liveModules } = useModules()
const { modules: coModules } = useCoMaintainedModules()
const { packages: npmPackages } = useNpmPackages()

const filter = ref<Filter>('all')

const drupalItems = computed(() =>
  liveModules.value.length ? liveModules.value : staticModules,
)

const allItems = computed(() => {
  const drupal = drupalItems.value.map(m => ({ ...m, type: 'author' as const, href: undefined as string | undefined }))
  const coMaint = coModules.value.map(m => ({ ...m, type: 'co-maint' as const, href: undefined as string | undefined }))
  const npm = npmPackages.value.map(p => ({ ...p, type: 'npm' as const }))

  let items: (typeof drupal[0] | typeof npm[0] | typeof coMaint[0])[]
  if (filter.value === 'drupal') items = drupal
  else if (filter.value === 'co-maint') items = coMaint
  else if (filter.value === 'npm') items = npm
  else items = [...drupal, ...coMaint, ...npm].sort((a, b) => b.sortKey - a.sortKey)

  const visible = items.filter(i => i.sortKey >= 100)
  const maxKey = visible.reduce((m, i) => Math.max(m, i.sortKey), 1)
  return visible.map(i => ({ ...i, percent: Math.round((i.sortKey / maxKey) * 100) }))
})

function moduleHref(m: { type: string; machine: string; href?: string }) {
  if (m.type === 'npm') return m.href
  return `https://www.drupal.org/project/${m.machine}`
}
</script>

<template>
  <div>
    <div class="mb-4 flex items-center gap-1 font-mono text-[12px]">
      <button
        v-for="f in (['all', 'drupal', 'co-maint', 'npm'] as const)"
        :key="f"
        class="rounded px-2.5 py-1 transition-colors"
        :class="filter === f ? 'bg-primary text-white' : 'text-dimmed hover:text-muted'"
        @click="filter = f"
      >
        {{ f }}
      </button>
    </div>
    <div class="max-h-[416px] overflow-y-auto">
      <SCModuleRow
        v-for="m in allItems"
        :key="`${m.type}-${m.machine}`"
        :name="m.name"
        :machine="m.machine"
        :installs="m.installs"
        :percent="m.percent"
        :href="moduleHref(m)"
        :type="m.type"
      />
    </div>
    <div class="mt-4 flex gap-2 font-mono text-[12px]">
      <a
        href="https://www.drupal.org/u/deciphered"
        target="_blank"
        rel="noopener noreferrer"
        class="flex-1 rounded border border-default bg-muted px-3 py-2 text-center text-dimmed transition-colors hover:border-primary/40 hover:text-muted"
      >drupal.org</a>
      <a
        href="https://github.com/Decipher"
        target="_blank"
        rel="noopener noreferrer"
        class="flex-1 rounded border border-default bg-muted px-3 py-2 text-center text-dimmed transition-colors hover:border-primary/40 hover:text-muted"
      >github</a>
      <a
        href="https://www.npmjs.com/~deciphered"
        target="_blank"
        rel="noopener noreferrer"
        class="flex-1 rounded border border-default bg-muted px-3 py-2 text-center text-dimmed transition-colors hover:border-primary/40 hover:text-muted"
      >npm</a>
    </div>
  </div>
</template>
