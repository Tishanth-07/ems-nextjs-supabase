"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function uploadProfilePhoto(formData: FormData) {
    const file = formData.get("file") as File
    if (!file) {
        return { error: "No file provided" }
    }

    if (!file.type.startsWith("image/")) {
        return { error: "Invalid file type. Please upload an image." }
    }

    if (file.size > 5 * 1024 * 1024) {
        return { error: "File size exceeds 5MB limit." }
    }

    const supabase = await createClient()

    // Get Current User
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return { error: "Unauthorized" }
    }

    const userId = user.id
    const fileExt = file.name.split(".").pop()
    const timestamp = Date.now()
    const filePath = `${userId}/avatar-${timestamp}.${fileExt}`

    // Upload to Storage
    const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, {
            upsert: true,
        })

    if (uploadError) {
        console.error("Upload error:", uploadError)
        return { error: "Failed to upload image. Please try again." }
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath)

    // Update Profile
    const { error: updateError } = await supabase
        .from("profiles")
        .update({ photo_url: publicUrl })
        .eq("id", userId)

    if (updateError) {
        console.error("Update profile error:", updateError)
        return { error: "Failed to update profile photo URL." }
    }

    revalidatePath("/profile")
    revalidatePath("/", "layout") // Update sidebar avatar globally

    return { success: true, url: publicUrl }
}

export async function removeProfilePhoto() {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        return { error: "Unauthorized" }
    }

    // Optional: Delete from storage?
    // We could list files in the folder and delete them.
    // For now, simpler to just set URL to null. Clean up could be a separate cron or logic.
    // But let's try to delete the folder contents to keep it clean.

    // List files
    const { data: files } = await supabase.storage
        .from("profile-photos")
        .list(user.id) // List files in user's folder

    if (files && files.length > 0) {
        const pathsToDelete = files.map(f => `${user.id}/${f.name}`)
        await supabase.storage.from("profile-photos").remove(pathsToDelete)
    }

    // Update Profile
    const { error: updateError } = await supabase
        .from("profiles")
        .update({ photo_url: null })
        .eq("id", user.id)

    if (updateError) {
        return { error: "Failed to remove photo." }
    }

    revalidatePath("/profile")
    revalidatePath("/", "layout")

    return { success: true }
}
