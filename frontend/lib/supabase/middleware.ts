import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()
    const pathname = url.pathname

    console.log('[Middleware] ===== NEW REQUEST =====')
    console.log('[Middleware] Path:', pathname)
    console.log('[Middleware] Has user:', !!user)
    if (user) console.log('[Middleware] User ID:', user.id)

    // 1. If no user and trying to access protected routes, redirect to signin
    const protectedPaths = ['/admin', '/manager', '/employee', '/dashboard', '/profile', '/attendance', '/leaves']
    const isProtected = protectedPaths.some(p => pathname.startsWith(p))

    if (!user && isProtected) {
        console.log('[Middleware] No user, redirecting to signin from:', pathname)
        return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // 2. If user is logged in, fetch their role
    if (user) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        console.log('[Middleware] Profile fetch error:', profileError)
        console.log('[Middleware] Profile data:', profile)

        const role = profile?.role || 'employee'

        console.log('[Middleware] *** DETECTED ROLE:', role, '***')
        console.log('[Middleware] User:', user.id, 'Role:', role, 'Path:', pathname)

        // 3. Redirect authenticated users from auth pages to their dashboard
        if (pathname.startsWith('/auth') || pathname === '/') {
            const dashboardPath = role === 'admin' ? '/admin'
                : role === 'manager' ? '/manager'
                    : '/employee'
            console.log('[Middleware] Redirecting from auth page to:', dashboardPath)
            return NextResponse.redirect(new URL(dashboardPath, request.url))
        }

        // 4. Protect role-specific routes
        if (pathname.startsWith('/admin') && role !== 'admin') {
            const redirectPath = role === 'manager' ? '/manager' : '/employee'
            console.log('[Middleware] Non-admin accessing /admin, redirecting to:', redirectPath)
            return NextResponse.redirect(new URL(redirectPath, request.url))
        }

        if (pathname.startsWith('/manager') && role !== 'manager') {
            const redirectPath = role === 'admin' ? '/admin' : '/employee'
            console.log('[Middleware] Non-manager accessing /manager, redirecting to:', redirectPath)
            return NextResponse.redirect(new URL(redirectPath, request.url))
        }

        if (pathname.startsWith('/employee') && role !== 'employee') {
            const redirectPath = role === 'admin' ? '/admin' : '/manager'
            console.log('[Middleware] Non-employee accessing /employee, redirecting to:', redirectPath)
            return NextResponse.redirect(new URL(redirectPath, request.url))
        }

        // 5. Generic /dashboard redirect to role-specific dashboard
        if (pathname === '/dashboard') {
            const dashboardPath = role === 'admin' ? '/admin'
                : role === 'manager' ? '/manager'
                    : '/employee'
            console.log('[Middleware] Redirecting from /dashboard to:', dashboardPath)
            return NextResponse.redirect(new URL(dashboardPath, request.url))
        }
    }

    return response
}
