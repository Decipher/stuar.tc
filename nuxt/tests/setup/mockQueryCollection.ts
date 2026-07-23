// Shared `queryCollection()` mock builder for page/route tests. A stub that
// ignores the field/direction arguments (as these mocks previously did)
// can't catch ordering regressions — e.g. two articles sharing a calendar
// day but published hours apart, which only sorts correctly if `date` is
// compared as a full timestamp, not string-equal truncated dates — so this
// one actually sorts.
export function createQueryCollectionMock<T extends Record<string, unknown>>(data: T[]) {
  function builder(rows: T[]) {
    return {
      order(field: keyof T, direction: 'ASC' | 'DESC' = 'ASC') {
        const sorted = [...rows].sort((a, b) => {
          const av = a[field]
          const bv = b[field]
          if (av === bv) return 0
          const cmp = av! < bv! ? -1 : 1
          return direction === 'DESC' ? -cmp : cmp
        })
        return builder(sorted)
      },
      limit(n: number) {
        return builder(rows.slice(0, n))
      },
      path(p: string) {
        // mountSuspended doesn't simulate a real matched route for these
        // page tests, so `useRoute().path` won't equal any real article's
        // `path` — fall back to the full set (mirroring the old mocks'
        // always-return-first behaviour) rather than matching nothing.
        const matched = rows.filter((r) => r.path === p)
        return builder(matched.length ? matched : rows)
      },
      all: async () => rows,
      first: async () => rows[0],
    }
  }

  return () => builder(data)
}
