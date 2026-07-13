const HOME_TITLE = 'Stuart Clark · stuar.tc'

export function applyTitleTemplate(title?: string): string | null {
  if (!title) return null
  return title !== HOME_TITLE ? `${title} · stuar.tc` : title
}
