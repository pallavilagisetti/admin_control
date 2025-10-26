"use client"
import jwt from 'jsonwebtoken'

export default function MetabasePage() {
  const METABASE_SITE_URL = process.env.NEXT_PUBLIC_METABASE_SITE_URL || ''
  const METABASE_EMBED_SECRET = process.env.NEXT_PUBLIC_METABASE_EMBED_SECRET || ''
  const payload = {
    resource: { dashboard: Number(process.env.NEXT_PUBLIC_METABASE_DASHBOARD_ID || '0') },
    params: {},
    exp: Math.round(Date.now() / 1000) + (10 * 60),
  }
  const token = METABASE_EMBED_SECRET ? jwt.sign(payload, METABASE_EMBED_SECRET) : ''
  const src = token ? `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=true&titled=true` : ''
  
  return (
    <div className="h-[80vh] card overflow-hidden">
      {src ? (
        <iframe src={src} frameBorder="0" width="100%" height="100%" allowFullScreen />
      ) : (
        <div className="p-6 text-white/70">
          <h2 className="text-xl font-semibold mb-4">Metabase Dashboard</h2>
          <p>Set NEXT_PUBLIC_METABASE_* environment variables to render the dashboard.</p>
        </div>
      )}
    </div>
  )
}



