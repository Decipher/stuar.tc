<template>
  <div>
    <Gravatar
      class="max-w-sm rounded-lg shadow-2xl"
      email="stu@rtclark.net"
      :size="600"
    />
    <!-- @TODO - Social links -->
  </div>
</template>

<script>
import Gravatar from 'vue-gravatar'

export default {
  components: { Gravatar }
}
</script>
