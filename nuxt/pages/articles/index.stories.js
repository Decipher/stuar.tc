import Index from './index.vue'

export default {
  title: 'Site/Pages/Articles',
  component: Index,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { Index },
  template: '<Index />',
})

export const Default = Template.bind({})
Default.storyName = 'Index'
