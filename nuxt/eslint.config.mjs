// @ts-check
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  pluginVueA11y.configs['flat/recommended'],
  {
    ignores: [
      'storybook-static/**',
      'coverage*/**',
      '*.bak',
      '*.bak.old',
    ],
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
    },
  },
)
