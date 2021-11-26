import DuiCard from './Card.vue'

export default {
  title: 'DUI/Card',
  component: DuiCard,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { DuiCard },
  template: '<DuiCard v-bind="$props">Card body text</DuiCard>'
})

export const Default = Template.bind({})
Default.args = {
  title: 'Card title',
  to: '/',
}
