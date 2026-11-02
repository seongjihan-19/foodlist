export default function ProductTable({ products, total, selectedCode, onSelect }) {
  return (
    <section className="panel table-panel">
      <p className="count">{products.length} / {total}개</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>상품코드</th>
              <th>상품명</th>
              <th>카테고리</th>
              <th>산지</th>
              <th>용량</th>
              <th className="num">판매가</th>
              <th>알레르기</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.product_code}
                className={p.product_code === selectedCode ? 'selected' : ''}
                onClick={() => onSelect(p.product_code)}
              >
                <td>{p.product_code}</td>
                <td>{p.product_name}</td>
                <td>{p.category}</td>
                <td>{p.origin ?? '—'}</td>
                <td>{formatAmount(p)}</td>
                <td className="num">{p.price_krw.toLocaleString('ko-KR')}원</td>
                <td><AllergenBadges product={p} /></td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} className="empty">조건에 맞는 상품이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function formatAmount(p) {
  const amount = `${Number(p.net_amount)}${p.unit}`
  return p.pack_count ? `${amount} · ${p.pack_count}` : amount
}

// 함유 물질은 빨강, 교차오염은 주황, 함유 미기재는 회색으로 표시
export function AllergenBadges({ product }) {
  const rows = product.product_allergens
  return (
    <span className="badges">
      {rows.map((a) => (
        <span key={a.allergen + a.contact_type} className={`badge ${a.contact_type === '함유' ? 'contains' : 'cross'}`}>
          {a.allergen}{a.contact_type === '교차오염' ? '(교차)' : ''}
        </span>
      ))}
      {product.allergen_status === '미기재' && <span className="badge unknown">함유 미기재</span>}
      {rows.length === 0 && product.allergen_status === '없음' && <span className="muted">없음</span>}
    </span>
  )
}
