<template>
  <div class="hero min-h-screen bg-base-200 py-40">
    <div class="container mx-auto">
      <div class="flex-col hero-content md:flex-row-reverse">
        <slot name="image" />
        <div class="flex-1">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
