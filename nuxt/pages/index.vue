<template>
  <div>
    <!-- Hero: Hello world block -->
    <DruxtEntity v-bind="helloWorld">
      <template #default="{ entity }">
        <DuiHero>
          <h1
            class="mb-5 text-5xl font-bold"
            v-text="entity.attributes.field_display_title"
          />
          <div class="mb-5 prose" v-html="entity.attributes.body.processed" />

          <template #image>
            <StuartClark />
          </template>
        </DuiHero>
      </template>
    </DruxtEntity>

    <!-- Blog -->
    <div class="container mx-auto py-20 px-4">
      <h2 class="mb-5 text-4xl font-bold">/Blog</h2>
      <DruxtView view-id="blog">
        <template #default="{ results }">
          <div class="md:grid grid-cols-3 gap-4">
            <DruxtEntity
              v-for="(result, index) of results"
              :key="`DruxtView::${result.id}`"
              class="h-full mb-4"
              :class="{
                'col-span-3': index === 0,
              }"
              :type="result.type"
              :uuid="result.id"
              mode="card"
              :mini="index !== 0"
            />
          </div>
        </template>
      </DruxtView>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    // Hello world block.
    helloWorld: {
      type: 'block_content--basic_block',
      uuid: '01b799f4-47b7-45d7-91b3-175e8b67625d',
      settings: {
        query: {
          fields: ['body', 'field_display_title'],
        },
      },
    },
  }),
}
</script>
