import { useState } from 'react'
import { createProduct } from '../supabase.js'
import {
  CATEGORIES, UNITS, ALLERGEN_STATUSES, STAGES, STORAGE_TYPES,
  DURATION_UNITS, NOTE_TYPES, CONTACT_TYPES, PRODUCT_CODE_PATTERN,
} from '../constants.js'

const EMPTY_PRODUCT = {
  product_code: '', product_name: '', category: CATEGORIES[0], origin: '',
  ingredients: '', allergen_status: '미기재', net_amount: '', unit: UNITS[0],
  pack_count: '', price_krw: '', sale_season: '상시', description: '',
}
const NEW_ROW = {
  storage: { stage: STAGES[0], storage_type: STORAGE_TYPES[0], duration: '', duration_unit: DURATION_UNITS[0] },
  notes: { note_type: NOTE_TYPES[0], content: '', reason: '' },
  allergens: { allergen: '', contact_type: CONTACT_TYPES[0] },
}

export default function ProductForm({ existingCodes, onCancel, onCreated }) {
  const [product, setProduct] = useState(EMPTY_PRODUCT)
  const [rows, setRows] = useState({ storage: [], notes: [], allergens: [] })
  const [errors, setErrors] = useState([])
  const [saving, setSaving] = useState(false)

  const setField = (name) => (e) => setProduct({ ...product, [name]: e.target.value })
  const addRow = (kind) => setRows({ ...rows, [kind]: [...rows[kind], { ...NEW_ROW[kind] }] })
  const removeRow = (kind, i) => setRows({ ...rows, [kind]: rows[kind].filter((_, j) => j !== i) })
  const setRowField = (kind, i, name) => (e) =>
    setRows({ ...rows, [kind]: rows[kind].map((r, j) => (j === i ? { ...r, [name]: e.target.value } : r)) })

  // DB 제약과 같은 기준으로 먼저 검사해 오류를 한 번에 보여 준다
  function validate() {
    const list = []
    const code = product.product_code.trim()
    if (!PRODUCT_CODE_PATTERN.test(code)) list.push('상품코드는 P-0000 형식이어야 합니다.')
    else if (existingCodes.includes(code)) list.push(`${code}는 이미 있는 상품코드입니다.`)
    if (!product.product_name.trim()) list.push('상품명을 입력하세요.')
    if (!product.ingredients.trim()) list.push('원재료를 입력하세요.')
    if (!(Number(product.net_amount) > 0)) list.push('용량은 0보다 큰 숫자여야 합니다.')
    if (!Number.isInteger(Number(product.price_krw)) || product.price_krw === '' || Number(product.price_krw) < 0) {
      list.push('판매가는 0 이상의 정수여야 합니다.')
    }
    rows.storage.forEach((r, i) => {
      if (!(Number.isInteger(Number(r.duration)) && Number(r.duration) > 0)) list.push(`보관기간 ${i + 1}행: 기간은 1 이상의 정수여야 합니다.`)
    })
    const storageKeys = rows.storage.map((r) => `${r.stage}|${r.storage_type}`)
    if (new Set(storageKeys).size !== storageKeys.length) list.push('보관기간에 시점·보관방식이 같은 행이 있습니다.')
    rows.notes.forEach((r, i) => { if (!r.content.trim()) list.push(`안내사항 ${i + 1}행: 내용을 입력하세요.`) })
    rows.allergens.forEach((r, i) => { if (!r.allergen.trim()) list.push(`알레르기 ${i + 1}행: 물질을 입력하세요.`) })
    const allergenKeys = rows.allergens.map((r) => `${r.allergen.trim()}|${r.contact_type}`)
    if (new Set(allergenKeys).size !== allergenKeys.length) list.push('알레르기에 같은 물질·구분이 중복됐습니다.')
    if (product.allergen_status === '있음' && !rows.allergens.some((r) => r.contact_type === '함유')) {
      list.push('알레르기 함유가 "있음"이면 구분이 "함유"인 알레르기 행이 하나 이상 있어야 합니다.')
    }
    if (product.allergen_status !== '있음' && rows.allergens.some((r) => r.contact_type === '함유')) {
      list.push('"함유" 알레르기 행이 있으면 알레르기 함유를 "있음"으로 선택하세요.')
    }
    return list
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const list = validate()
    setErrors(list)
    if (list.length > 0) return

    // 빈 선택 항목은 null로, 숫자 항목은 숫자로 바꿔 보낸다
    const blankToNull = (v) => (v.trim() === '' ? null : v.trim())
    const payload = {
      ...product,
      product_code: product.product_code.trim(),
      product_name: product.product_name.trim(),
      ingredients: product.ingredients.trim(),
      origin: blankToNull(product.origin),
      pack_count: blankToNull(product.pack_count),
      description: blankToNull(product.description),
      sale_season: product.sale_season.trim() || '상시',
      net_amount: Number(product.net_amount),
      price_krw: Number(product.price_krw),
    }
    setSaving(true)
    try {
      await createProduct(payload, {
        storage: rows.storage.map((r) => ({ ...r, duration: Number(r.duration) })),
        notes: rows.notes.map((r) => ({ ...r, content: r.content.trim(), reason: blankToNull(r.reason) })),
        allergens: rows.allergens.map((r) => ({ ...r, allergen: r.allergen.trim() })),
      })
      onCreated(payload.product_code)
    } catch (err) {
      setErrors([err.message])
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>상품 추가</h2>

        <fieldset>
          <legend>기본 정보</legend>
          <div className="grid">
            <label>상품코드 *<input value={product.product_code} onChange={setField('product_code')} placeholder="P-0000" /></label>
            <label>상품명 *<input value={product.product_name} onChange={setField('product_name')} /></label>
            <label>카테고리 *<Select value={product.category} onChange={setField('category')} options={CATEGORIES} /></label>
            <label>산지<input value={product.origin} onChange={setField('origin')} placeholder="비우면 미기재" /></label>
            <label className="wide">원재료 *<input value={product.ingredients} onChange={setField('ingredients')} /></label>
            <label>용량 *<input type="number" step="any" min="0" value={product.net_amount} onChange={setField('net_amount')} /></label>
            <label>용량단위 *<Select value={product.unit} onChange={setField('unit')} options={UNITS} /></label>
            <label>입수<input value={product.pack_count} onChange={setField('pack_count')} placeholder="예: 10개, 30포" /></label>
            <label>판매가(원) *<input type="number" step="1" min="0" value={product.price_krw} onChange={setField('price_krw')} /></label>
            <label>판매기간<input value={product.sale_season} onChange={setField('sale_season')} /></label>
            <label>알레르기 함유 *<Select value={product.allergen_status} onChange={setField('allergen_status')} options={ALLERGEN_STATUSES} /></label>
            <label className="wide">특징<textarea rows={2} value={product.description} onChange={setField('description')} /></label>
          </div>
        </fieldset>

        <fieldset>
          <legend>보관기간</legend>
          {rows.storage.map((r, i) => (
            <div className="row" key={i}>
              <Select value={r.stage} onChange={setRowField('storage', i, 'stage')} options={STAGES} />
              <Select value={r.storage_type} onChange={setRowField('storage', i, 'storage_type')} options={STORAGE_TYPES} />
              <input type="number" min="1" step="1" placeholder="기간" value={r.duration} onChange={setRowField('storage', i, 'duration')} />
              <Select value={r.duration_unit} onChange={setRowField('storage', i, 'duration_unit')} options={DURATION_UNITS} />
              <button type="button" onClick={() => removeRow('storage', i)}>삭제</button>
            </div>
          ))}
          <button type="button" className="link" onClick={() => addRow('storage')}>+ 보관기간 추가</button>
        </fieldset>

        <fieldset>
          <legend>안내사항</legend>
          {rows.notes.map((r, i) => (
            <div className="row" key={i}>
              <Select value={r.note_type} onChange={setRowField('notes', i, 'note_type')} options={NOTE_TYPES} />
              <input className="grow" placeholder="내용" value={r.content} onChange={setRowField('notes', i, 'content')} />
              <input className="grow" placeholder="이유 (선택)" value={r.reason} onChange={setRowField('notes', i, 'reason')} />
              <button type="button" onClick={() => removeRow('notes', i)}>삭제</button>
            </div>
          ))}
          <button type="button" className="link" onClick={() => addRow('notes')}>+ 안내사항 추가</button>
        </fieldset>

        <fieldset>
          <legend>알레르기</legend>
          {rows.allergens.map((r, i) => (
            <div className="row" key={i}>
              <input className="grow" placeholder="물질 (예: 대두)" value={r.allergen} onChange={setRowField('allergens', i, 'allergen')} />
              <Select value={r.contact_type} onChange={setRowField('allergens', i, 'contact_type')} options={CONTACT_TYPES} />
              <button type="button" onClick={() => removeRow('allergens', i)}>삭제</button>
            </div>
          ))}
          <button type="button" className="link" onClick={() => addRow('allergens')}>+ 알레르기 추가</button>
        </fieldset>

        {errors.length > 0 && (
          <ul className="message error form-errors" role="alert">
            {errors.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}

        <div className="actions">
          <button type="button" onClick={onCancel} disabled={saving}>취소</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? '저장 중…' : '저장'}</button>
        </div>
      </form>
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={onChange}>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  )
}
