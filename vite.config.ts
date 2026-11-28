import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite'
import { PHONE_SCRIPT } from './src/lib/device.ts'
import { OPEN_AT } from './src/lib/open-date.ts'

// Marks <html data-cta-phase="before|after"> from the visitor's clock and <html data-device="phone|pc"> (lib/device.ts)
// before first paint, so the prerendered HTML shows the right CTA label and date copy without waiting for React.
// QA `?cta=` only outside production.
function ctaPhaseScript(qa: boolean): Plugin {
  const qaPart = qa ? `var q=new URLSearchParams(location.search).get('cta');if(q==='before')a=false;else if(q==='open'||q==='preparing')a=true;` : ''
  const code = `(function(){var a=Date.now()>=${OPEN_AT};try{${qaPart}}catch(e){}document.documentElement.setAttribute('data-cta-phase',a?'after':'before')})()`
  return {
    name: 'capsule-cta-phase',
    transformIndexHtml: { order: 'pre', handler: html => html.replace('<!-- cta-phase -->', `<script>${code};${PHONE_SCRIPT}</script>`) },
  }
}

// Search-console verification tags only when their build variables are set.
function siteVerification(google: string | undefined, naver: string | undefined): Plugin {
  const escape = (value: string) => value.replace(/[^A-Za-z0-9_\-.:]/g, '')
  const tags = [
    google?.trim() ? `<meta name="google-site-verification" content="${escape(google)}" />` : '',
    naver?.trim() ? `<meta name="naver-site-verification" content="${escape(naver)}" />` : '',
  ].filter(Boolean).join('\n  ')
  return {
    name: 'capsule-site-verification',
    transformIndexHtml: html => html.replace('<!-- site-verification -->', tags),
  }
}

// `vite preview` behaves like Vercel for unknown addresses: dist/404.html with status 404 (Vercel serves a
// root 404.html by itself). Files, `/`, the retired paths (rewritten in vercel.json) and the API proxy pass.
const PREVIEW_PAGES = new Set(['/', '/index.html', '/rooms', '/preorder', '/done', '/survey', '/test'])
function previewNotFound(): Plugin {
  return {
    name: 'capsule-preview-404',
    configurePreviewServer(server) {
      const dist = join(server.config.root, server.config.build.outDir)
      server.middlewares.use((request, response, next) => {
        const path = decodeURIComponent((request.url ?? '/').split(/[?#]/)[0]!).replace(/(.)\/+$/, '$1')
        if (PREVIEW_PAGES.has(path) || path.startsWith('/api/') || existsSync(join(dist, path))) return next()
        const page = join(dist, '404.html')
        if (!existsSync(page)) return next()
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(readFileSync(page))
      })
    },
  }
}

// The landing's origin is refused by the API's CORS, so the browser calls this same-origin path and the
// server forwards it (vercel.json in deployments, this proxy in `vite` and `vite preview`). Public GET only.
const loginMatesProxy: Record<string, ProxyOptions> = {
  '/api/login-mates': {
    target: 'https://api.capsule.ai.kr',
    changeOrigin: true,
    configure: proxy => {
      proxy.on('proxyReq', (request, incoming, response) => {
        request.removeHeader('origin')
        request.removeHeader('cookie')
        if (incoming.method !== 'GET' && incoming.method !== 'HEAD') {
          response.writeHead(405, { Allow: 'GET, HEAD' }).end()
          request.destroy()
        }
      })
    },
  },
}

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const qa = command === 'serve' || env.VITE_VERCEL_ENV === 'preview'
  return {
    plugins: [react(), ctaPhaseScript(qa), siteVerification(env.VITE_GOOGLE_SITE_VERIFICATION, env.VITE_NAVER_SITE_VERIFICATION), previewNotFound()],
    // Pixel pictures and avatars repeat across the prerendered page: keep them as cached files instead of
    // inlining the same data URL into the HTML and the JS several times.
    build: { assetsInlineLimit: (file: string) => (/[\\/]assets[\\/](pixel|mates)[\\/]/.test(file) ? false : undefined) },
    server: { proxy: loginMatesProxy },
    preview: { proxy: loginMatesProxy },
  }
})
