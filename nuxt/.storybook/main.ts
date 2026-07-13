import type { StorybookConfig } from '@storybook-vue/nuxt'

const config: StorybookConfig = {
  stories: [
    '../app/**/*.stories.ts',
    '../node_modules/@stuartclark/ui/src/runtime/components/**/*.stories.ts',
  ],
  framework: {
    name: '@storybook-vue/nuxt',
    options: {},
  },
  viteFinal: (config) => {
    // Filter out @nuxtjs/mdc nested-dep entries that Vite can't resolve
    // in Storybook context (pnpm doesn't hoist transitive deps).
    const include = config.optimizeDeps?.include
    if (Array.isArray(include)) {
      config.optimizeDeps!.include = include.filter(
        (entry: string) => !entry.includes('@nuxtjs/mdc'),
      )
    }
    // Allow Cloudflare Quick Tunnel hostnames (random *.trycloudflare.com)
    config.server ??= {}
    config.server.allowedHosts = true
    return config
  },
}

export default config
