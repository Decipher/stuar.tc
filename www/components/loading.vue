<template>
  <a-entity position="0 0 -10">
    <a-animation
      attribute="rotation"
      dur="5000"
      easing="linear"
      repeat="indefinite"
      to="0 0 -360"
    ></a-animation>
    <a-entity
      v-for="i in 8"

      :key="i"
      :rotation="`0 0 ${i * (360 / 8)}`">
      <a-box
        :position="`1.5 0 0`"

        color="red"
        depth="0.5"
        width="0.5"
        height="0.5"
      ></a-box>
    </a-entity>
  </a-entity>
</template>

<script>
  export default {}
</script>
