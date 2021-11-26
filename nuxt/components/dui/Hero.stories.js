import DuiHero from './Hero.vue'

export default {
  title: 'DUI/Hero',
  component: DuiHero,
}

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { DuiHero },
  template: '<DuiHero v-bind="$props">Hero body</DuiHero>'
})

export const Default = Template.bind({})

// @TODO - Add story for hero with image slot.
