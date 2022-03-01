import Article from './_path.vue'

export default {
  title: 'Site/Pages/Articles/Article',
  component: Article,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Article },
  template: '<Article v-bind="$props" />',
})

export const Default = Template.bind({})
Default.args = {
  path: '/article/hello-world-20211126',
}
Default.storyName = 'Article'
