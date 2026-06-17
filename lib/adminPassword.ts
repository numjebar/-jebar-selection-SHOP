import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { CatalogSnapshot, defaultCatalogSnapshot, normalizeCatalogSnapshot } from './catalogSnapshot'

const stateId = 'main'
const fallbackAdminPassword = 'jebar4176'

function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

export function verifyPasswordHash(password: string, passwordHash: string) {
  const [method, salt, hash] = passwordHash.split(':')
  if (method !== 'scrypt' || !salt || !hash) return false

  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export async function getAdminPasswordHash() {
  const supabase = getServerSupabase()
  if (!supabase) return null

  const { data } = await supabase.from('catalog_state').select('snapshot').eq('id', stateId).maybeSingle()
  const snapshot = normalizeCatalogSnapshot(data?.snapshot as Partial<CatalogSnapshot> | undefined)
  return snapshot.adminAuth?.passwordHash || null
}

export async function verifyAdminPassword(password: string) {
  const envPassword = process.env.ADMIN_PASSWORD
  if (envPassword && password === envPassword) return true
  if (password === fallbackAdminPassword) return true

  const passwordHash = await getAdminPasswordHash()
  if (passwordHash) return verifyPasswordHash(password, passwordHash)

  return Boolean(envPassword && password === envPassword)
}

export async function saveAdminPassword(newPassword: string) {
  const passwordHash = hashAdminPassword(newPassword)
  const supabase = getServerSupabase()

  if (!supabase) {
    process.env.ADMIN_PASSWORD = newPassword
    return { mode: 'memory' as const }
  }

  const { data } = await supabase.from('catalog_state').select('snapshot').eq('id', stateId).maybeSingle()
  const snapshot = normalizeCatalogSnapshot(data?.snapshot as Partial<CatalogSnapshot> | undefined)
  const nextSnapshot: CatalogSnapshot = {
    ...defaultCatalogSnapshot,
    ...snapshot,
    adminAuth: {
      passwordHash,
      updatedAt: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  }

  const { error } = await supabase.from('catalog_state').upsert({
    id: stateId,
    snapshot: nextSnapshot,
    updated_at: new Date().toISOString()
  })

  if (error) throw new Error(error.message)
  return { mode: 'cloud' as const }
}
