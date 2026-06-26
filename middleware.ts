import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Roda apenas nas rotas protegidas — não em páginas públicas, API routes ou assets estáticos.
  matcher: ['/dashboard/:path*'],
}
