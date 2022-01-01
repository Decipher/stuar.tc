import { mapState } from 'vuex'

export default {
  computed: mapState({
    config: (state) => state.config,
  }),
}
