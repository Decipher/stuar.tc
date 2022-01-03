import path from 'path'
import initStoryshots from '@storybook/addon-storyshots'

initStoryshots({
  configPath: path.resolve(__dirname, '../.nuxt-storybook/storybook'),
  framework: 'vue',
})
