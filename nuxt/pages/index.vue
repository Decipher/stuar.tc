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
    <div class="container mx-auto py-20">
      <h2 class="mb-5 text-4xl font-bold">.Blog</h2>
      <DruxtView view-id="blog">
        <template #default="{ results }">
          <!-- <DruxtDebug><pre><code>{{ JSON.stringify(results, null, '  ') }}</code></pre></DruxtDebug> -->
          <DruxtEntity
            v-for="result of results"
            :key="`DruxtView::${result.id}`"
            :type="result.type"
            :uuid="result.id"
            :settings="{
              query: {
                include: ['field_blog_category'],
                fields: [
                  ['created', 'field_blog_category', 'field_description', 'path', 'title'],
                  ['taxonomy_term--blog', ['name']]
                ]
              }
            }"
          >
            <template #default="{ entity }">
              <DuiCard :title="entity.attributes.title" :to="entity.attributes.path.alias">
                <!-- <DruxtDebug><pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre></DruxtDebug> -->
                <div class="flex gap-1">
                  <DuiBadge
                    class="mb-3"
                    size="sm"
                    v-text="$moment(entity.attributes.created).format('YY.MM.DD')"
                  />
                  <!-- Category badge -->
                  <DuiBadge class="mb-5" size="sm" type="primary">{{ entity.included.find((o) => o.type === 'taxonomy_term--blog').attributes.name }}</DuiBadge>
                </div>
                <div class="prose" v-html="entity.attributes.field_description.processed" />
              </DuiCard>
            </template>
          </DruxtEntity>
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
      type: "block_content--basic_block",
      uuid: "01b799f4-47b7-45d7-91b3-175e8b67625d",
      settings: {
        query: {
          fields: ["body", "field_display_title"],
        },
      },
    },
  }),
};
</script>
