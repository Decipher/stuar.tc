/**
 * Storybook stories for AppSplash component.
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import AppSplash from '../components/AppSplash.vue'

const meta = {
  title: 'Atoms/AppSplash',
  component: AppSplash,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
    },
  },
} satisfies Meta<typeof AppSplash>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
