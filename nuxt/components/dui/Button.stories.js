import DuiButton from './Button.vue'

export default {
  title: 'DUI/Button',
  component: DuiButton,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { DuiButton },
  template: '<DuiButton v-bind="$props">Text</DuiButton>'
})

export const Default = Template.bind({})
