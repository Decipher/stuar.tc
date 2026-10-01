export interface Module {
  name: string
  machine: string
  installs: string
  percent: number
  sortKey: number
  stars?: string
}

export const modules: Module[] = [
  { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '32,140', percent: 100, sortKey: 32140 },
  { name: 'JSON:API Menu Items', machine: 'jsonapi_menu_items', installs: '4,992', percent: 16, sortKey: 4992 },
  { name: 'ImageField Tokens', machine: 'imagefield_tokens', installs: '4,083', percent: 13, sortKey: 4083 },
  { name: 'Custom Formatters', machine: 'custom_formatters', installs: '3,063', percent: 10, sortKey: 3063 },
  { name: 'DruxtJS', machine: 'druxt', installs: '1,142', percent: 4, sortKey: 1142 },
  { name: 'Field Tokens', machine: 'field_tokens', installs: '911', percent: 3, sortKey: 911 },
  { name: 'Mobile Codes', machine: 'mobile_codes', installs: '378', percent: 1, sortKey: 378 },
  { name: 'Administration Menu select', machine: 'admin_select', installs: '170', percent: 1, sortKey: 170 },
]
