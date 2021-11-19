<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="container mx-auto">
      <div class="flex-col hero-content md:flex-row-reverse">
        <slot name="image" />
        <div>
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
