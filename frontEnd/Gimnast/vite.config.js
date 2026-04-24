
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/login': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/surveys': 'http://localhost:8080',
      '/survey': 'http://localhost:8080',
      '/samples': 'http://localhost:8080',
      '/sample': 'http://localhost:8080',
      '/routes': 'http://localhost:8080',
      '/route': 'http://localhost:8080',
      '/questionnaires': 'http://localhost:8080',
      '/questionnaire': 'http://localhost:8080',
      '/question': 'http://localhost:8080',
      '/answer': 'http://localhost:8080',
      '/cities': 'http://localhost:8080',
      '/user': 'http://localhost:8080',
      '/exports': 'http://localhost:8080',
    },
  },
})