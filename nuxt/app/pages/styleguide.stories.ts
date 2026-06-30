/**
 * Storybook stories for the Styleguide page.
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import StyleguidePage from '../pages/styleguide.vue'

const meta = {
  title: 'Pages/Styleguide',
  component: StyleguidePage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Design system showcase page displaying all components and color tokens.',
      },
    },
  },
} satisfies Meta<typeof StyleguidePage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
