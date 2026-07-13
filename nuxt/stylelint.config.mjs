/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-vue',
  ],
  rules: {
    'property-no-unknown': [true, {
      ignoreProperties: ['text-wrap'],
    }],
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['deep', 'global', 'slotted'],
    }],
  },
}
