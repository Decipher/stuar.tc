/**
 * Storybook stories for AppQrCode component.
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import AppQrCode from '../components/AppQrCode.vue'

const meta = {
  title: 'Atoms/AppQrCode',
  component: AppQrCode,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
  },
  argTypes: {
    level: {
      control: 'select',
      options: ['L', 'M', 'Q', 'H'],
    },
  },
} satisfies Meta<typeof AppQrCode>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 'https://stuar.tc/',
    size: 128,
    level: 'H',
  },
}

export const Large: Story = {
  args: {
    value: 'https://stuar.tc/about',
    size: 220,
    level: 'H',
  },
}

export const FooterSize: Story = {
  name: 'Footer size (88px)',
  args: {
    value: 'https://stuar.tc/',
    size: 88,
    level: 'H',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
}
