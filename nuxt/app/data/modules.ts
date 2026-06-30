export interface Module {
  name: string
  machine: string
  installs: string
  percent: number
}

export const modules: Module[] = [
  { name: 'File (Field) Paths', machine: 'filefield_paths', installs: '31,546', percent: 100 },
  { name: 'Sample module', machine: 'contrib_module_02', installs: '3,210', percent: 34 },
  { name: 'Sample module', machine: 'contrib_module_03', installs: '1,180', percent: 14 },
  { name: 'Sample module', machine: 'contrib_module_04', installs: '640', percent: 8 },
]
