import { Category, Product, SelectionMap, defaultCategories, defaultProducts, defaultSelection } from './catalogData'
import { MessageSettings, defaultMessageSettings } from './messages'

export type CatalogSnapshot = {
  products: Product[]
  selection: SelectionMap
  categories: Category[]
  messages: MessageSettings
  adminAuth?: {
    passwordHash: string
    updatedAt: string
  }
  updatedAt?: string
}

export const defaultCatalogSnapshot: CatalogSnapshot = {
  products: defaultProducts,
  selection: defaultSelection,
  categories: defaultCategories,
  messages: defaultMessageSettings
}

export function normalizeCatalogSnapshot(value: Partial<CatalogSnapshot> | null | undefined): CatalogSnapshot {
  return {
    products: Array.isArray(value?.products) ? value.products : defaultProducts,
    selection: value?.selection && typeof value.selection === 'object' ? value.selection : defaultSelection,
    categories: Array.isArray(value?.categories) && value.categories.length > 0 ? value.categories : defaultCategories,
    messages: value?.messages ? { ...defaultMessageSettings, ...value.messages } : defaultMessageSettings,
    adminAuth: value?.adminAuth,
    updatedAt: value?.updatedAt
  }
}
