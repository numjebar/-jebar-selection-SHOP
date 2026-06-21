'use client'

export type CatalogEventName =
  | 'Catalog Viewed'
  | 'Catalog Started'
  | 'Cart Item Added'
  | 'Cart Item Removed'
  | 'Order Copied'

const visitorStorageKey = 'jebar.analytics.visitor.v1'
const sessionStorageKey = 'jebar.analytics.session.v1'

export function trackCatalogEvent(name: CatalogEventName, properties: Record<string, string | number | boolean> = {}) {
  try {
    const visitorId = getOrCreateId(localStorage, visitorStorageKey)
    const sessionId = getOrCreateId(sessionStorage, sessionStorageKey)

    void fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name,
        visitorId,
        sessionId,
        path: window.location.pathname,
        properties
      })
    }).catch(() => undefined)
  } catch {
    // Analytics must never interrupt the customer flow.
  }
}

function getOrCreateId(storage: Storage, key: string) {
  const existing = storage.getItem(key)
  if (existing) return existing

  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  storage.setItem(key, id)
  return id
}
