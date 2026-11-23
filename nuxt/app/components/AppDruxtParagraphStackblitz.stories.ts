/**
 * Storybook stories for the StackBlitz paragraph.
 *
 * The placeholder is what every reader sees first, so it is the default
 * story. `Running` loads a real StackBlitz project, which needs network
 * access and takes a while to boot.
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import { userEvent, within } from 'storybook/test'
import AppDruxtParagraphStackblitz from './AppDruxtParagraphStackblitz.vue'

const meta = {
  title: 'Paragraphs/AppDruxtParagraphStackblitz',
  component: AppDruxtParagraphStackblitz,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AppDruxtParagraphStackblitz>

export default meta
type Story = StoryObj<typeof meta>

const paragraph = {
  type: 'stackblitz' as const,
  title: 'Druxt 0.25.2 and Drupal Canvas, on a recorded Drupal CMS site',
  url: 'https://stackblitz.com/github/Decipher/druxt-canvas-demo?file=pages/_.vue',
  caption: '<p>A Nuxt 2 site on <code>druxt-site</code> 0.15.2 and <code>@druxt-contrib/canvas</code>, against the Dashi preset of <a href="https://github.com/Decipher/decoupled-drupal-mock">Decoupled Drupal Mock</a>.</p>',
}

export const Placeholder: Story = {
  args: { paragraph },
}

export const WithoutCaption: Story = {
  name: 'Without a caption',
  args: { paragraph: { ...paragraph, caption: undefined } },
}

export const Running: Story = {
  args: { paragraph },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Run the demo' }))
  },
}
