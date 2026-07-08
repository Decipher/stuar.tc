export interface Module {
  name: string
  machine: string
  installs: string
  percent: number
  sortKey: number
  stars?: string
}

export const modules: Module[] = [
  { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '30,463', percent: 100, sortKey: 30463 },
  { name: 'ImageField Tokens', machine: 'imagefield_tokens', installs: '3,446', percent: 11, sortKey: 3446 },
  { name: 'JSON:API Menu Items', machine: 'jsonapi_menu_items', installs: '3,206', percent: 11, sortKey: 3206 },
  { name: 'Custom Formatters', machine: 'custom_formatters', installs: '3,116', percent: 10, sortKey: 3116 },
  { name: 'Field Tokens', machine: 'field_tokens', installs: '902', percent: 3, sortKey: 902 },
  { name: 'Mobile Codes', machine: 'mobile_codes', installs: '400', percent: 1, sortKey: 400 },
]
