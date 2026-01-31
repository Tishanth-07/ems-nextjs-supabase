import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.user) {
            // Update is_verified in profiles table after successful email verification
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ is_verified: true })
                .eq('id', data.user.id)

            if (updateError) {
                console.error('[Auth Callback] Failed to update is_verified:', updateError)
                // Don't block the login, just log the error
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
