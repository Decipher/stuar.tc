/**
 * Storybook stories for the Drupal Give page.
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import DrupalGivePage from '../pages/drupalgive.vue'

const meta = {
  title: 'Pages/DrupalGive',
  component: DrupalGivePage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Drupal.org community contributions overview with give-back cards.',
      },
    },
  },
} satisfies Meta<typeof DrupalGivePage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
