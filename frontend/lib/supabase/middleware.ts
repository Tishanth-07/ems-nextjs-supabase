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

    const url = request.nextUrl.clone()
    const path = url.pathname

    // 4. Role-Based Access Control
    // Fetch profile to determine role
    let userRole = 'employee'
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role) {
            userRole = profile.role
        }
    }

    // 4.1 Redirect authenticated users from Auth pages to their Dashboard
    if (user && (path.startsWith('/auth') || path === '/login' || path === '/')) {
        // If user visits root or login, send to role dashboard
        if (path === '/' || path.startsWith('/auth')) {
            if (userRole === 'admin') url.pathname = '/admin'
            else if (userRole === 'manager') url.pathname = '/manager'
            else url.pathname = '/employee'
            return NextResponse.redirect(url)
        }
    }

    // 4.2 Protected Routes
    const protectedPrefixes = ['/admin', '/manager', '/employee', '/dashboard', '/profile', '/attendance', '/leaves']
    const isProtected = protectedPrefixes.some(prefix => path.startsWith(prefix))

    if (isProtected) {
        if (!user) {
            url.pathname = '/auth/signin'
            // Add next param for better UX
            // url.searchParams.set('next', path) 
            return NextResponse.redirect(url)
        }

        // 4.3 Path-Role Mismatch Check
        // /dashboard -> Redirect to role root
        if (path === '/dashboard') {
            if (userRole === 'admin') url.pathname = '/admin'
            else if (userRole === 'manager') url.pathname = '/manager'
            else url.pathname = '/employee'
            return NextResponse.redirect(url)
        }

        // Admin Paths
        if (path.startsWith('/admin') && userRole !== 'admin') {
            // Unauthorized access to admin, redirect to own dashboard
            if (userRole === 'manager') url.pathname = '/manager'
            else url.pathname = '/employee'
            return NextResponse.redirect(url)
        }

        // Manager Paths
        if (path.startsWith('/manager') && userRole !== 'manager' && userRole !== 'admin') {
            // Managers can access /manager. Admins usually can too? 
            // Phase requirement: "/manager/* -> only manager". 
            // Usually Admins have super-access. Let's allow Admin.
            // But User Prompt says: "Admins sees admin menu + admin content".
            // If Admin goes to /manager, they might see Manager Dashboard?
            // Let's stick to strict: Admin -> /admin.
            // If Admin tries /manager, redirect to /admin?
            // User Prompt: "/manager/* -> only 'manager'". 
            // I will enforce Strict Separation.
            if (userRole === 'admin') {
                url.pathname = '/admin'
                return NextResponse.redirect(url)
            }
            url.pathname = '/employee'
            return NextResponse.redirect(url)
        }

        // Employee Paths
        // Employee -> /employee.
        // If Admin tries /employee?
        // Let's redirect them to /admin.
        if (path.startsWith('/employee') && userRole !== 'employee') {
            if (userRole === 'admin') url.pathname = '/admin'
            else if (userRole === 'manager') url.pathname = '/manager'
            return NextResponse.redirect(url)
        }
    }

    return response
}
