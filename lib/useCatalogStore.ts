'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Category,
  Product,
  SelectionMap,
  categoriesStorageKey,
  defaultCategories,
  defaultProducts,
  defaultSelection,
  makeCategoryCode,
  productsStorageKey,
  selectionStorageKey
} from './catalogData'
import { CatalogSnapshot } from './catalogSnapshot'
import { loadCloudCatalogSnapshot, saveCloudCatalogSnapshot } from './cloudCatalogStore'
import { MessageSettings, defaultMessageSettings, messageSettingsStorageKey } from './messages'

export function useCatalogStore() {
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [selection, setSelection] = useState<SelectionMap>(defaultSelection)
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [messages, setMessages] = useState<MessageSettings>(defaultMessageSettings)
  const [savedAt, setSavedAt] = useState('')
  const [warning, setWarning] = useState('')
  const [storageMode, setStorageMode] = useState<'cloud' | 'local'>('local')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function loadStore() {
      const storedProducts = safeReadLocalStorage(productsStorageKey)
      const storedSelection = safeReadLocalStorage(selectionStorageKey)
      const storedCategories = safeReadLocalStorage(categoriesStorageKey)
      const storedMessages = safeReadLocalStorage(messageSettingsStorageKey)

      if (storedProducts) setProducts(JSON.parse(storedProducts))
      if (storedSelection) setSelection(JSON.parse(storedSelection))
      if (storedCategories) {
        const parsedCategories = JSON.parse(storedCategories)
        if (Array.isArray(parsedCategories) && parsedCategories.length > 0) setCategories(parsedCategories)
      }
      if (storedMessages) setMessages({ ...defaultMessageSettings, ...JSON.parse(storedMessages) })

      const cloudSnapshot = await loadCloudCatalogSnapshot()
      if (cloudSnapshot) {
        setProducts(cloudSnapshot.products)
        setSelection(cloudSnapshot.selection)
        setCategories(cloudSnapshot.categories)
        setMessages(cloudSnapshot.messages)
        setStorageMode('cloud')
      }

      setIsReady(true)
    }

    loadStore()
  }, [])

  useEffect(() => {
    if (!isReady) return

    const snapshot = makeSnapshot(products, selection, categories, messages)

    if (storageMode === 'cloud') {
      saveCloudCatalogSnapshot(snapshot).then((saved) => {
        if (!saved) setWarning('บันทึกขึ้น Cloud ไม่สำเร็จ กรุณาเช็คการเข้าสู่ระบบหรืออินเทอร์เน็ต')
      })
    }

    const localSaved = saveSafeLocalCache(products, selection, categories, messages)
    setWarning(localSaved ? '' : 'พื้นที่ browser เต็ม ระบบยังเก็บข้อมูลขึ้น Cloud แต่จะไม่เก็บรูปซ้ำในเครื่องนี้')
    setSavedAt(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }))
  }, [categories, isReady, messages, products, selection, storageMode])

  const stats = useMemo(() => {
    const todayProducts = products.filter((product) => selection[product.id]?.isAvailable)
    const totalQuantity = todayProducts.reduce((sum, product) => sum + (selection[product.id]?.quantity || 0), 0)

    return {
      totalProducts: products.length,
      todayProducts: todayProducts.length,
      catalogCount: 1,
      totalQuantity
    }
  }, [products, selection])

  function updateProduct(id: string, changes: Partial<Product>) {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, ...changes } : product)))
  }

  function updateSelection(id: string, changes: Partial<SelectionMap[string]>) {
    setSelection((current) => ({
      ...current,
      [id]: {
        quantity: current[id]?.quantity || 0,
        isAvailable: current[id]?.isAvailable || false,
        ...changes
      }
    }))
  }

  function updateMessages(changes: Partial<MessageSettings>) {
    setMessages((current) => ({ ...current, ...changes }))
  }

  function addCategory(label: string) {
    const trimmedLabel = label.trim()
    if (!trimmedLabel) return
    setCategories((current) => [...current, { code: makeCategoryCode(trimmedLabel), label: trimmedLabel }])
  }

  function updateCategory(code: string, label: string) {
    setCategories((current) => current.map((category) => (category.code === code ? { ...category, label } : category)))
  }

  function removeCategory(code: string) {
    if (categories.length <= 1) return

    const nextCategories = categories.filter((category) => category.code !== code)
    const fallbackCode = nextCategories[0]?.code || defaultCategories[0].code

    setCategories(nextCategories)
    setProducts((currentProducts) =>
      currentProducts.map((product) => (product.category === code ? { ...product, category: fallbackCode } : product))
    )
  }

  function resetDemo() {
    setProducts(defaultProducts)
    setSelection(defaultSelection)
    setCategories(defaultCategories)
    setMessages(defaultMessageSettings)
  }

  return {
    products,
    selection,
    categories,
    messages,
    savedAt,
    warning,
    storageMode,
    stats,
    setProducts,
    setSelection,
    setCategories,
    setMessages,
    updateProduct,
    updateSelection,
    addCategory,
    updateCategory,
    removeCategory,
    updateMessages,
    resetDemo
  }
}

export function resizeImageForStorage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const image = new Image()

      image.onerror = () => reject(new Error('Cannot load image'))
      image.onload = () => {
        const maxSize = 900
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))

        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Cannot resize image'))
          return
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }

      image.src = String(reader.result)
    }

    reader.readAsDataURL(file)
  })
}

function makeSnapshot(products: Product[], selection: SelectionMap, categories: Category[], messages: MessageSettings): CatalogSnapshot {
  return {
    products,
    selection,
    categories,
    messages,
    updatedAt: new Date().toISOString()
  }
}

function saveSafeLocalCache(products: Product[], selection: SelectionMap, categories: Category[], messages: MessageSettings) {
  try {
    localStorage.setItem(productsStorageKey, JSON.stringify(stripLargeInlineImages(products)))
    localStorage.setItem(selectionStorageKey, JSON.stringify(selection))
    localStorage.setItem(categoriesStorageKey, JSON.stringify(categories))
    localStorage.setItem(messageSettingsStorageKey, JSON.stringify(messages))
    return true
  } catch {
    try {
      localStorage.removeItem(productsStorageKey)
      localStorage.removeItem(selectionStorageKey)
      localStorage.removeItem(categoriesStorageKey)
      localStorage.removeItem(messageSettingsStorageKey)
    } catch {
      // ignore browser storage cleanup errors
    }
    return false
  }
}

function stripLargeInlineImages(products: Product[]) {
  return products.map((product) => {
    if (!product.imageUrl?.startsWith('data:image/')) return product
    return { ...product, imageUrl: '' }
  })
}

function safeReadLocalStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
