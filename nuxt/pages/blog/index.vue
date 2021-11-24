<template>
  <DuiHero>
    <DruxtView view-id="blog">
      <template #default="{ results }">
        <DruxtEntity
          v-for="result of results"
          :key="`DruxtView::${result.id}`"
          :type="result.type"
          :uuid="result.id"
          mode="card"
        />
      </template>
    </DruxtView>
  </DuiHero>
</template>
