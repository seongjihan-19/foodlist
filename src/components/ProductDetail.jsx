import { NOTE_TYPES } from '../constants.js'
import { AllergenBadges, formatAmount } from './ProductTable.jsx'

export default function ProductDetail({ product, onDelete }) {
  if (!product) {
    return <aside className="panel detail empty">목록에서 상품을 선택하세요.</aside>
  }

  // 안내사항을 유형 순서대로 묶는다
  const notesByType = NOTE_TYPES
    .map((type) => [type, product.product_notes.filter((n) => n.note_type === type)])
    .filter(([, rows]) => rows.length > 0)

  return (
    <aside className="panel detail">
      <div className="detail-head">
        <div>
          <p className="code">{product.product_code} · {product.category}</p>
          <h2>{product.product_name}</h2>
        </div>
        {onDelete && <button className="danger" onClick={() => onDelete(product)}>삭제</button>}
      </div>

      <dl className="facts">
        <dt>산지</dt><dd>{product.origin ?? '미기재'}</dd>
        <dt>원재료</dt><dd>{product.ingredients}</dd>
        <dt>용량</dt><dd>{formatAmount(product)}</dd>
        <dt>판매가</dt><dd>{product.price_krw.toLocaleString('ko-KR')}원</dd>
        <dt>판매기간</dt><dd>{product.sale_season}</dd>
        <dt>알레르기</dt><dd><AllergenBadges product={product} /></dd>
        {product.description && (<><dt>특징</dt><dd>{product.description}</dd></>)}
      </dl>

      <h3>보관기간</h3>
      {product.storage_periods.length === 0 ? (
        <p className="muted">등록된 보관기간이 없습니다.</p>
      ) : (
        <ul className="plain">
          {[...product.storage_periods].sort((a, b) => a.id - b.id).map((s) => (
            <li key={s.id}>{s.stage} · {s.storage_type} <strong>{s.duration}{s.duration_unit}</strong></li>
          ))}
        </ul>
      )}

      <h3>안내사항</h3>
      {notesByType.length === 0 ? (
        <p className="muted">등록된 안내사항이 없습니다.</p>
      ) : (
        notesByType.map(([type, rows]) => (
          <div key={type} className="note-group">
            <p className={`note-type ${type === '금지' || type === '섭취주의' ? 'warn' : ''}`}>{type}</p>
            <ul className="plain">
              {rows.map((n) => (
                <li key={n.id}>{n.content}{n.reason && <span className="muted"> — {n.reason}</span>}</li>
              ))}
            </ul>
          </div>
        ))
      )}
    </aside>
  )
}
