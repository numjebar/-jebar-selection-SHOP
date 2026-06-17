export async function uploadCatalogImage(productId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('productId', productId)

  const response = await fetch('/api/catalog-image', {
    method: 'POST',
    body: formData
  })

  const data = (await response.json().catch(() => ({}))) as { imageUrl?: string; error?: string }

  if (!response.ok || !data.imageUrl) {
    throw new Error(data.error || 'Upload failed')
  }

  return data.imageUrl
}
