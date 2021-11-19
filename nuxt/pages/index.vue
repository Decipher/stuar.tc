<template>
  <div>
    <!-- <DruxtDebug><pre><code>{{ JSON.stringify(entity, null, '  ') }}</code></pre></DruxtDebug> -->

    <!-- Hello world block -->
    <DruxtEntity v-bind="helloWorld">
      <template #default="{ entity }">
        <DuiHero>
          <h1
            class="mb-5 text-5xl font-bold"
            v-text="entity.attributes.field_display_title"
          />
          <div class="mb-5 prose" v-html="entity.attributes.body.processed" />

          <template #image>
            <Gravatar
              class="max-w-sm rounded-lg shadow-2xl"
              email="stu@rtclark.net"
              :size="600"
            />
          </template>
        </DuiHero>
      </template>
    </DruxtEntity>
  </div>
</template>

<script>
import Gravatar from "vue-gravatar";

export default {
  components: { Gravatar },

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
