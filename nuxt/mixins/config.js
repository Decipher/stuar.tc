export default {
  computed: {
    config: ({ $druxtConfigPages }) => $druxtConfigPages.get('druxt_settings'),
  },
}
