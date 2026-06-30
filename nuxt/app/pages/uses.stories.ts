/**
 * Storybook stories for the Uses page.
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import UsesPage from '../pages/uses.vue'

const meta = {
  title: 'Pages/Uses',
  component: UsesPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: '/uses page with hardware, software, and desk setup cards.',
      },
    },
  },
} satisfies Meta<typeof UsesPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
