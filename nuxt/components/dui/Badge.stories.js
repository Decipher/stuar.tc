import DuiBadge from './Badge.vue'

export default {
  title: 'DUI/Badge',
  component: DuiBadge,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { DuiBadge },
  template: '<DuiBadge v-bind="$props">Text</DuiBadge>'
})

export const Default = Template.bind({})
