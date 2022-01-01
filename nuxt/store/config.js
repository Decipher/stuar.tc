export const state = () => ({
  title: undefined,
  social: {
    drupal: undefined,
    github: undefined,
    gravatar: undefined,
    twitter: undefined,
  },
})

export const mutations = {
  set: (state, data) => {
    state.title = data.title
    state.social = data.social
  },
}

export const actions = {
  init: async ({ commit }, { $druxt }) => {
    const collection = await $druxt.getCollection(
      'config_pages--druxt_settings'
    )
    const entity = collection.data.shift()
    const data = {
      title: entity.attributes.field_site_name,
      social: {
        drupal: entity.attributes.field_social_drupal,
        github: entity.attributes.field_social_github,
        gravatar: entity.attributes.field_social_gravatar,
        twitter: entity.attributes.field_social_twitter,
      },
    }
    commit('set', data)
  },
}
