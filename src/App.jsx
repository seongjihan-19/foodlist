import { useCallback, useEffect, useMemo, useState } from 'react'
import { initConnection, isDeployed, usesEnvFile, canWrite, disconnect, fetchProducts, deleteProduct } from './supabase.js'
import { CATEGORIES, ALLERGEN_STATUSES } from './constants.js'
import ProductTable from './components/ProductTable.jsx'
import ProductDetail from './components/ProductDetail.jsx'
import ProductForm from './components/ProductForm.jsx'
import ConnectionSetup from './components/ConnectionSetup.jsx'

export default function App() {
  const [connected, setConnected] = useState(() => initConnection())
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [allergenStatus, setAllergenStatus] = useState('')
  const [selectedCode, setSelectedCode] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProducts(await fetchProducts())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (connected) load()
  }, [connected, load])

  // 검색어는 상품 정보와 하위 테이블(알레르기 물질, 안내 내용)까지 함께 찾는다
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      if (category && p.category !== category) return false
      if (allergenStatus && p.allergen_status !== allergenStatus) return false
      if (!q) return true
      const haystack = [
        p.product_code, p.product_name, p.origin, p.ingredients, p.description,
        ...p.product_allergens.map((a) => a.allergen),
        ...p.product_notes.map((n) => n.content),
      ]
      return haystack.some((v) => v && v.toLowerCase().includes(q))
    })
  }, [products, query, category, allergenStatus])

  const selected = products.find((p) => p.product_code === selectedCode) ?? null

  async function handleDelete(product) {
    const ok = window.confirm(
      `${product.product_code} ${product.product_name}을(를) 삭제할까요?\n보관기간·안내사항·알레르기 정보도 함께 삭제되며 되돌릴 수 없습니다.`,
    )
    if (!ok) return
    try {
      await deleteProduct(product.product_code)
      setSelectedCode(null)
      setNotice(`${product.product_name}을(를) 삭제했습니다.`)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleCreated(code) {
    setFormOpen(false)
    setNotice(`${code} 상품을 추가했습니다.`)
    await load()
    setSelectedCode(code)
  }

  function handleDisconnect() {
    if (!window.confirm('저장된 연결 정보를 지우고 연결 화면으로 돌아갈까요?')) return
    disconnect()
    setProducts([])
    setSelectedCode(null)
    setError('')
    setNotice('')
    setConnected(false)
  }

  // 배포 사이트에는 연결 입력 화면을 띄우지 않는다 (공개 페이지에서 키를 입력받지 않기 위해)
  if (!connected) {
    return isDeployed ? <DeployConfigMissing /> : <ConnectionSetup onConnected={() => setConnected(true)} />
  }

  // service_role 키 없이 anon 키만 있으면 추가·삭제 버튼을 숨긴다
  const writable = canWrite()

  return (
    <div className="app">
      <header className="app-header">
        <h1>상품 관리 {!writable && <span className="badge unknown">읽기 전용</span>}</h1>
        <div className="header-actions">
          {!usesEnvFile && <button onClick={handleDisconnect}>연결 해제</button>}
          {writable && <button className="primary" onClick={() => setFormOpen(true)}>+ 상품 추가</button>}
        </div>
      </header>

      <section className="filters">
        <input
          type="search"
          placeholder="상품명, 코드, 산지, 원재료, 알레르기 물질로 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">카테고리 전체</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={allergenStatus} onChange={(e) => setAllergenStatus(e.target.value)}>
          <option value="">알레르기 함유 전체</option>
          {ALLERGEN_STATUSES.map((s) => <option key={s} value={s}>함유 {s}</option>)}
        </select>
        <button onClick={load} disabled={loading}>{loading ? '불러오는 중…' : '새로고침'}</button>
      </section>

      {error && <p className="message error" role="alert">{error} <button onClick={() => setError('')}>닫기</button></p>}
      {notice && <p className="message notice">{notice} <button onClick={() => setNotice('')}>닫기</button></p>}

      <main className="layout">
        <ProductTable
          products={filtered}
          total={products.length}
          selectedCode={selectedCode}
          onSelect={setSelectedCode}
        />
        <ProductDetail product={selected} onDelete={writable ? handleDelete : null} />
      </main>

      {formOpen && (
        <ProductForm
          existingCodes={products.map((p) => p.product_code)}
          onCancel={() => setFormOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

// 배포 사이트에 환경 변수가 없을 때 보이는 안내 (관리자용)
function DeployConfigMissing() {
  return (
    <div className="app setup">
      <h1>상품 관리</h1>
      <p className="message error">사이트 설정이 아직 끝나지 않았습니다.</p>
      <p className="hint">
        관리자: Vercel 프로젝트 → Settings → Environment Variables에 <code>VITE_SUPABASE_URL</code>과{' '}
        <code>VITE_SUPABASE_ANON_KEY</code>를 추가한 뒤 다시 배포하세요. service_role 키는 넣지 않습니다.
      </p>
    </div>
  )
}
