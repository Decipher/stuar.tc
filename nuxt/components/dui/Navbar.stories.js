import DuiNavbar from './Navbar.vue'

export default {
  title: 'DUI/Navbar',
  component: DuiNavbar,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { DuiNavbar },
  template: '<DuiNavbar v-bind="$props">Hero body</DuiNavbar>',
})

export const Default = Template.bind({})
Default.args = {
  title: 'Title',
}
