<template>
  <component
    :is="component.is"
    class="btn"
    :class="classes"
    role="button"
    v-bind="component.props || {}"
  >
    <slot />
  </component>
</template>

<script>
export default {
  props: {
    href: {
      type: String,
      default: undefined,
    },

    /**
     * The button theme
     *
     * @type {string}
     */
    theme: {
      type: String,
      default: 'neutral',
    },

    to: {
      type: String,
      default: undefined,
    }
  },

  computed: {
    classes: ({ theme }) => [
      theme ? `btn-${theme}` : undefined
    ],

    component: ({ href, to }) => {
      if (href) return { is: 'a', props: { href } }
      if (to) return { is: 'nuxt-link', props: { tag: 'button' }}
      return { is: 'button' }
    }
  }
}
</script>
