import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './profile-form'
import { ProfilePhotoUploader } from '@/components/profile/profile-photo-uploader'
import { Separator } from '@/components/ui/separator'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">My Profile</h1>
            <div className="bg-white dark:bg-card shadow rounded-lg p-6 space-y-6">
                <div className="flex flex-col gap-6">
                    <h2 className="text-lg font-semibold">Profile Photo</h2>
                    <ProfilePhotoUploader
                        userId={user.id}
                        userName={profile?.full_name || profile?.username || "User"}
                        currentPhotoUrl={profile?.photo_url}
                    />
                </div>

                <Separator />

                <div className="flex flex-col gap-6">
                    <h2 className="text-lg font-semibold">Personal Information</h2>
                    <ProfileForm user={user} profile={profile} />
                </div>
            </div>
        </div>
    )
}
