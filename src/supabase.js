import { createClient } from '@supabase/supabase-js'

// 연결 정보는 .env.local이 있으면 그것을, 없으면 화면에서 입력해 브라우저에 저장한 값을 쓴다
const STORAGE_KEY = 'product-admin.connection'
const envConfig = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  serviceKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
}

// 조회는 anon 키(RLS 읽기 정책), 추가·삭제는 service_role 키로 한다
// service_role 키가 없으면 writeClient가 null이라 읽기 전용으로 동작한다
let readClient = null
let writeClient = null

function makeClient({ url, key }, name = 'main') {
  // service_role 키는 RLS를 무시하므로 로컬에서만 사용한다. 로그인 세션은 쓰지 않음
  // 조회용 · 쓰기용 클라이언트가 같은 저장 이름을 쓰면 경고가 나므로 이름을 나눈다
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: `product-admin-${name}` },
  })
}

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return saved?.url && saved?.key ? saved : null
  } catch {
    return null
  }
}

export const usesEnvFile = Boolean(envConfig.url && (envConfig.anonKey || envConfig.serviceKey))

// 앱 시작 시 저장된 연결 정보로 클라이언트를 만든다. 연결 정보가 없으면 false
export function initConnection() {
  if (usesEnvFile) {
    const { url, anonKey, serviceKey } = envConfig
    writeClient = serviceKey ? makeClient({ url, key: serviceKey }, 'write') : null
    readClient = anonKey ? makeClient({ url, key: anonKey }, 'read') : writeClient
    return true
  }
  const saved = readSaved()
  if (!saved) return false
  readClient = writeClient = makeClient(saved)
  return true
}

export const canWrite = () => writeClient !== null

// 입력받은 값으로 실제 조회를 한 번 해 보고, 성공해야 저장한다
export async function connect(url, key) {
  const client = makeClient({ url, key })
  const { error } = await client.from('products').select('product_code', { head: true, count: 'exact' })
  if (error) throw toFriendlyError(error)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, key }))
  } catch {
    // 저장이 막힌 브라우저에서는 이번 실행 동안만 연결을 유지한다
  }
  readClient = writeClient = client
}

export function disconnect() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // 저장소 접근이 막혀 있어도 연결만 끊으면 된다
  }
  readClient = writeClient = null
}

// 상품과 하위 테이블을 한 번에 가져오는 select 구문 (외래키로 자동 연결)
const PRODUCT_SELECT = '*, storage_periods(*), product_notes(*), product_allergens(*)'

export async function fetchProducts() {
  const { data, error } = await readClient
    .from('products')
    .select(PRODUCT_SELECT)
    .order('product_code')
  if (error) throw toFriendlyError(error)
  return data
}

// 상품을 먼저 넣고 하위 행을 넣는다. 하위 행이 실패하면 상품을 지워 되돌린다(하위 행은 cascade로 함께 삭제)
export async function createProduct(product, { storage, notes, allergens }) {
  const supabase = requireWriteClient()
  const { error } = await supabase.from('products').insert(product)
  if (error) throw toFriendlyError(error)

  const code = product.product_code
  const children = [
    ['storage_periods', storage],
    ['product_notes', notes],
    ['product_allergens', allergens],
  ]
  for (const [table, rows] of children) {
    if (rows.length === 0) continue
    const { error: childError } = await supabase
      .from(table)
      .insert(rows.map((row) => ({ ...row, product_code: code })))
    if (childError) {
      await supabase.from('products').delete().eq('product_code', code)
      throw toFriendlyError(childError)
    }
  }
}

export async function deleteProduct(code) {
  const { error } = await requireWriteClient().from('products').delete().eq('product_code', code)
  if (error) throw toFriendlyError(error)
}

function requireWriteClient() {
  if (!writeClient) throw new Error('읽기 전용입니다. 추가·삭제하려면 .env.local에 service_role 키를 넣으세요.')
  return writeClient
}

// PostgreSQL · Supabase 오류를 알아보기 쉬운 문장으로 바꾼다
function toFriendlyError(error) {
  const messages = {
    23505: '이미 있는 값입니다. 상품코드나 같은 조건의 행이 중복되지 않았는지 확인하세요.',
    23514: '허용되지 않는 값이 있습니다. 목록에서 고른 값과 숫자 범위를 확인하세요.',
    23502: '필수 값이 비어 있습니다.',
    42501: '권한이 없습니다. service_role 키를 넣었는지 확인하세요.',
    '42P01': 'products 테이블이 없습니다. Supabase에서 schema.sql과 seed.sql을 먼저 실행하세요.',
    PGRST205: 'products 테이블이 없습니다. Supabase에서 schema.sql과 seed.sql을 먼저 실행하세요.',
  }
  if (!error.code && /fetch/i.test(error.message ?? '')) {
    return new Error('Supabase에 접속하지 못했습니다. Project URL이 맞는지, 인터넷이 연결돼 있는지 확인하세요.')
  }
  if (!error.code && !error.message) {
    return new Error('접속이 거부됐습니다. 키가 맞는지, Legacy API keys 탭의 service_role 키인지 확인하세요.')
  }
  const friendly = messages[error.code]
  return new Error(friendly ? `${friendly} (${error.message})` : error.message || '알 수 없는 오류가 났습니다.')
}
