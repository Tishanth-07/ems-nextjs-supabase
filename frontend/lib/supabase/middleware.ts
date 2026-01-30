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

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected Routes Logic
    const url = request.nextUrl.clone()
    const path = url.pathname

    // 1. Redirect authenticated users away from auth pages
    if (user && (path.startsWith('/auth') || path === '/login')) {
        // Redirect to their specific dashboard based on role?
        // Since we don't have the profile easily here without querying, 
        // we'll query it or default to a safe place.
        // For better UX during "already logged in" visits, let's query the role.
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'employee'
        if (role === 'admin') url.pathname = '/admin'
        else if (role === 'manager') url.pathname = '/manager'
        else url.pathname = '/employee'

        return NextResponse.redirect(url)
    }

    // 2. Protect Dashboard Routes
    const protectedPrefixes = ['/admin', '/manager', '/employee', '/profile', '/attendance', '/leaves', '/dashboard']
    const isProtectedRoute = protectedPrefixes.some(prefix => path.startsWith(prefix))

    if (isProtectedRoute) {
        if (!user) {
            url.pathname = '/auth/signin'
            return NextResponse.redirect(url)
        }

        // 3. Enforce Role Access
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role || 'employee'

        // Generic /dashboard redirect
        if (path === '/dashboard') {
            if (role === 'admin') url.pathname = '/admin'
            else if (role === 'manager') url.pathname = '/manager'
            else url.pathname = '/employee'
            return NextResponse.redirect(url)
        }

        // Admin only routes
        if (path.startsWith('/admin') && role !== 'admin') {
            // Redirect unauthorized users to their own dashboard
            if (role === 'manager') url.pathname = '/manager'
            else url.pathname = '/employee'
            return NextResponse.redirect(url)
        }

        // Manager only routes (if any specific, currently /manager)
        if (path.startsWith('/manager') && !['admin', 'manager'].includes(role)) {
            url.pathname = '/employee'
            return NextResponse.redirect(url)
        }
    }

    return response
}
