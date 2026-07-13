export interface Module {
  name: string
  machine: string
  installs: string
  percent: number
  sortKey: number
  stars?: string
}

export const modules: Module[] = [
  { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '29,589', percent: 100, sortKey: 29589 },
  { name: 'ImageField Tokens', machine: 'imagefield_tokens', installs: '4,459', percent: 15, sortKey: 4459 },
  { name: 'Custom Formatters', machine: 'custom_formatters', installs: '3,222', percent: 11, sortKey: 3222 },
  { name: 'JSON:API Menu Items', machine: 'jsonapi_menu_items', installs: '3,107', percent: 11, sortKey: 3107 },
  { name: 'Field Tokens', machine: 'field_tokens', installs: '879', percent: 3, sortKey: 879 },
  { name: 'Mobile Codes', machine: 'mobile_codes', installs: '393', percent: 1, sortKey: 393 },
  { name: 'Administration Menu select', machine: 'admin_select', installs: '185', percent: 1, sortKey: 185 },
]
