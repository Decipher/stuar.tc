/**
 * Storybook stories for the minimal layout.
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import MinimalLayout from '../layouts/minimal.vue'

const meta = {
  title: 'Layouts/Minimal',
  component: MinimalLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'The minimal layout provides a distraction-free reading shell with just the logo, theme toggle, and a compact footer.',
      },
    },
  },
} satisfies Meta<typeof MinimalLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: { MinimalLayout },
    template: `
      <MinimalLayout>
        <div class="min-h-[50vh] flex items-center justify-center">
          <article class="prose dark:prose-invert max-w-2xl">
            <h1>Article Title</h1>
            <p>This is the reading experience using the minimal layout. No navigation header, just the logo and theme toggle.</p>
            <p>The content flows naturally without distractions, making it ideal for long-form articles and documentation pages.</p>
          </article>
        </div>
      </MinimalLayout>
    `,
  }),
}
