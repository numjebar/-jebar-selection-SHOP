import { CatalogSnapshot, normalizeCatalogSnapshot } from './catalogSnapshot'

type CatalogStateResponse = {
  mode: 'cloud' | 'local'
  saved?: boolean
  snapshot?: Partial<CatalogSnapshot>
  error?: string
}

export async function loadCloudCatalogSnapshot() {
  try {
    const response = await fetch('/api/catalog-state', { cache: 'no-store' })
    if (!response.ok) return null

    const data = (await response.json()) as CatalogStateResponse
    if (data.mode !== 'cloud' || !data.snapshot) return null

    return normalizeCatalogSnapshot(data.snapshot)
  } catch {
    return null
  }
}

export async function saveCloudCatalogSnapshot(snapshot: CatalogSnapshot) {
  try {
    const response = await fetch('/api/catalog-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot })
    })

    if (!response.ok) return false
    const data = (await response.json()) as CatalogStateResponse
    return data.mode === 'cloud' && data.saved === true
  } catch {
    return false
  }
}
