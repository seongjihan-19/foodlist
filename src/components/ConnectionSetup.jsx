import { useState } from 'react'
import { connect } from '../supabase.js'

export default function ConnectionSetup({ onConnected }) {
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    // 붙여 넣을 때 딸려 오는 공백 · 따옴표 · 끝의 / 를 정리한다
    const cleanUrl = url.trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '')
    const cleanKey = key.trim().replace(/^["']|["']$/g, '')
    if (!/^https?:\/\/.+/.test(cleanUrl)) return setError('Project URL은 https:// 로 시작해야 합니다.')
    if (!cleanKey) return setError('service_role 키를 붙여 넣으세요.')
    if (cleanKey.startsWith('sb_publishable_') || cleanKey.startsWith('sb_secret_')) {
      return setError('새 형식 키는 쓸 수 없습니다. Legacy API keys 탭의 service_role 키(eyJ로 시작)를 넣으세요.')
    }

    setChecking(true)
    setError('')
    try {
      await connect(cleanUrl, cleanKey)
      onConnected()
    } catch (err) {
      setError(err.message)
      setChecking(false)
    }
  }

  return (
    <div className="app setup">
      <h1>상품 관리</h1>
      <p className="muted">처음 한 번만 Supabase 연결 정보를 넣으면, 다음부터는 바로 열립니다.</p>

      <form className="panel setup-form" onSubmit={handleSubmit}>
        <label>
          Project URL
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://abcdefgh.supabase.co"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="hint">Supabase 대시보드 → Project Settings → Data API</span>
        </label>
        <label>
          service_role 키
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="eyJ로 시작하는 긴 문자열"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="hint">Project Settings → API Keys → Legacy API keys 탭 → service_role 옆 Reveal → 복사</span>
        </label>

        {error && <p className="message error" role="alert">{error}</p>}

        <button type="submit" className="primary" disabled={checking}>
          {checking ? '연결 확인 중…' : '연결'}
        </button>
        <p className="hint">
          키는 이 컴퓨터의 이 브라우저에만 저장됩니다. DB 전체를 수정할 수 있는 키이니 다른 사람과 공유하지 마세요.
        </p>
      </form>
    </div>
  )
}
