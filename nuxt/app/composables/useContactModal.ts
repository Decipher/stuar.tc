/**
 * Shared contact-modal visibility state.
 *
 * Any page or component can open the layout-level `SCContactModal` without
 * prop drilling or an event bus — just call this composable and set the
 * returned ref to `true`.
 *
 * @returns A writable SSR-safe `Ref<boolean>` bound to the contact modal.
 */
export function useContactModal() {
  return useState<boolean>('contact-open', () => false)
}
