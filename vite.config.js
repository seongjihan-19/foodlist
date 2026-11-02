import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 로컬 전용: 127.0.0.1에만 열어서 같은 네트워크의 다른 기기에서 접속할 수 없게 한다
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
})
