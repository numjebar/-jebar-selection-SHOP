export type Product = {
  id: string
  nameTh: string
  nameEn: string
  category: string
  price: number
  description: string
  promotion: string
  imageUrl: string
  isActive: boolean
  isFavorite: boolean
}

export type SelectionItem = {
  quantity: number
  isAvailable: boolean
}

export type SelectionMap = Record<string, SelectionItem>

export type Category = {
  code: string
  label: string
}

export const productsStorageKey = 'jebar.products.v2'
export const selectionStorageKey = 'jebar.selection.v2'
export const categoriesStorageKey = 'jebar.categories.v1'

export const defaultCategories: Category[] = [
  { code: 'CAKE', label: 'เค้ก' },
  { code: 'BREAD', label: 'ขนมปัง' },
  { code: 'PASTRY', label: 'Pastry' },
  { code: 'COOKIES_SNACKS', label: 'Snack' },
  { code: 'OTHERS', label: 'อื่น ๆ' }
]

export const allCategory = { code: 'ALL', label: 'ทั้งหมด' }
export const categories = [allCategory, ...defaultCategories]
export const productCategories = defaultCategories

export const defaultProducts: Product[] = [
  {
    id: 'basque-cheesecake',
    nameTh: 'Basque Cheesecake',
    nameEn: 'Basque Cheesecake',
    category: 'CAKE',
    price: 95,
    description: 'ชีสเค้กหน้าไหม้ เนื้อแน่นนุ่ม หวานน้อย',
    promotion: '',
    imageUrl: '',
    isActive: true,
    isFavorite: true
  },
  {
    id: 'brownie-fudge',
    nameTh: 'Brownie Fudge',
    nameEn: 'Brownie Fudge',
    category: 'COOKIES_SNACKS',
    price: 75,
    description: 'บราวนี่ช็อกโกแลตเข้มข้น เนื้อหนึบ',
    promotion: '',
    imageUrl: '',
    isActive: true,
    isFavorite: true
  },
  {
    id: 'eclair-chocolate',
    nameTh: 'Eclair Chocolate',
    nameEn: 'Chocolate Eclair',
    category: 'PASTRY',
    price: 45,
    description: 'เอแคลร์ช็อกโกแลต ครีมนุ่ม กินง่าย',
    promotion: '',
    imageUrl: '',
    isActive: true,
    isFavorite: false
  },
  {
    id: 'croissant-almond',
    nameTh: 'Croissant Almond',
    nameEn: 'Almond Croissant',
    category: 'BREAD',
    price: 65,
    description: 'ครัวซองต์อัลมอนด์ หอมเนย อบสด',
    promotion: '',
    imageUrl: '',
    isActive: true,
    isFavorite: false
  },
  {
    id: 'strawberry-shortcake',
    nameTh: 'Strawberry Shortcake',
    nameEn: 'Strawberry Shortcake',
    category: 'CAKE',
    price: 120,
    description: 'เค้กครีมสดสตรอว์เบอร์รี เนื้อเบา',
    promotion: '',
    imageUrl: '',
    isActive: true,
    isFavorite: false
  },
  {
    id: 'burnt-cheesecake',
    nameTh: 'Burnt Cheesecake',
    nameEn: 'Burnt Cheesecake',
    category: 'CAKE',
    price: 95,
    description: 'ชีสเค้กหน้าไหม้ รสเข้ม หอมครีมชีส',
    promotion: '',
    imageUrl: '',
    isActive: true,
    isFavorite: false
  },
  {
    id: 'red-velvet-cake',
    nameTh: 'Red Velvet Cake',
    nameEn: 'Red Velvet Cake',
    category: 'CAKE',
    price: 95,
    description: 'เรดเวลเวทครีมชีส หวานละมุน',
    promotion: '',
    imageUrl: '',
    isActive: true,
    isFavorite: false
  },
  {
    id: 'matcha-roll-cake',
    nameTh: 'Matcha Roll Cake',
    nameEn: 'Matcha Roll Cake',
    category: 'CAKE',
    price: 85,
    description: 'โรลมัทฉะครีมนุ่ม หอมชาเขียว',
    promotion: '',
    imageUrl: '',
    isActive: true,
    isFavorite: true
  }
]

export const defaultSelection: SelectionMap = {
  'basque-cheesecake': { quantity: 3, isAvailable: true },
  'brownie-fudge': { quantity: 5, isAvailable: true },
  'eclair-chocolate': { quantity: 8, isAvailable: true },
  'croissant-almond': { quantity: 0, isAvailable: false },
  'strawberry-shortcake': { quantity: 2, isAvailable: true },
  'burnt-cheesecake': { quantity: 4, isAvailable: true },
  'red-velvet-cake': { quantity: 3, isAvailable: true },
  'matcha-roll-cake': { quantity: 2, isAvailable: true }
}

export function formatBaht(value: number) {
  return `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(value)}.-`
}

export function getCategoryLabel(code: string, categoryList: Category[] = defaultCategories) {
  return categoryList.find((category) => category.code === code)?.label || code
}

export function getTodayLabel() {
  return new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date())
}

export function makeCategoryCode(label: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return `category-${slug || 'custom'}-${Date.now()}`
}

export function makeProductId(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/gi, '-')
    .replace(/^-+|-+$/g, '')

  return `${normalized || 'product'}-${Date.now()}`
}

export function getAvailableProducts(products: Product[], selection: SelectionMap) {
  return products.filter((product) => product.isActive && selection[product.id]?.isAvailable)
}

export function getTotalQuantity(products: Product[], selection: SelectionMap) {
  return products.reduce((total, product) => total + (selection[product.id]?.isAvailable ? selection[product.id]?.quantity || 0 : 0), 0)
}
