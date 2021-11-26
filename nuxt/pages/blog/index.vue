<template>
  <DuiHero>
    <h1 class="mb-5 text-5xl font-bold">/Blog</h1>
    <DruxtView view-id="blog">
      <template #default="{ results }">
        <DruxtEntity
          v-for="result of results"
          :key="`DruxtView::${result.id}`"
          class="mb-4"
          :type="result.type"
          :uuid="result.id"
          mode="card"
        />
      </template>
    </DruxtView>
  </DuiHero>
</template>
