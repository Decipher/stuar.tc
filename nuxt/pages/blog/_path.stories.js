import Blog from './_path.vue'

export default {
  title: 'Site/Pages/Blog/Post',
  component: Blog,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Blog },
  template: '<Blog v-bind="$props" />',
})

export const Default = Template.bind({})
Default.args = {
  path: '/blog/hello-world-20211126',
}
Default.storyName = 'Post'
