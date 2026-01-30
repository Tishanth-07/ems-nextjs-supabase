"use client"

import { useState, useRef } from "react"
import { Camera, Trash2, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CameraCaptureModal } from "./camera-capture-modal"
import { uploadProfilePhoto, removeProfilePhoto } from "@/app/(dashboard)/profile/actions"

interface ProfilePhotoUploaderProps {
    currentPhotoUrl?: string | null
    userId: string
    userName: string
    className?: string
    onPhotoUpdated?: (url: string | null) => void
}

export function ProfilePhotoUploader({
    currentPhotoUrl,
    userId,
    userName,
    className,
    onPhotoUpdated
}: ProfilePhotoUploaderProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle File Process
    const handleFileProcess = async (file: File) => {
        // Validate
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB")
            return
        }

        // Optimistic Preview
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)
        setIsLoading(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const result = await uploadProfilePhoto(formData)

            if (result.error) {
                toast.error(result.error)
                setPreviewUrl(currentPhotoUrl || null) // Revert
            } else if (result.success && result.url) {
                toast.success("Profile photo updated!")
                if (onPhotoUpdated) onPhotoUpdated(result.url)
                setPreviewUrl(result.url)
            }
        } catch (error) {
            toast.error("Upload failed. Please try again.")
            setPreviewUrl(currentPhotoUrl || null)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        handleFileProcess(file)
        e.target.value = "" // Reset
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const handleRemovePhoto = async () => {
        if (!confirm("Are you sure you want to remove your profile photo?")) return

        setIsLoading(true)
        try {
            const result = await removeProfilePhoto()
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Profile photo removed")
                setPreviewUrl(null)
                if (onPhotoUpdated) onPhotoUpdated(null)
            }
        } catch (error) {
            toast.error("Failed to remove photo")
        } finally {
            setIsLoading(false)
        }
    }

    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className={cn("flex flex-col items-center gap-4 sm:flex-row", className)}>
            <div className="relative group">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
                    <AvatarImage src={previewUrl || ""} alt={userName} className="object-cover" />
                    <AvatarFallback className="text-2xl sm:text-3xl bg-primary/10 text-primary">
                        {initials}
                    </AvatarFallback>
                </Avatar>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={triggerFileInput}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Upload Photo
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={isLoading}
                        className="gap-2"
                        onClick={() => setIsCameraOpen(true)}
                    >
                        <Camera className="h-4 w-4" />
                        Take Photo
                    </Button>
                </div>

                {previewUrl && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePhoto}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 justify-start w-fit px-2"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove photo
                    </Button>
                )}

                <p className="text-xs text-muted-foreground mt-1">
                    Recommended: Square JPG, PNG. Max 5MB.
                </p>

                {/* Hidden Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                />
            </div>

            <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleFileProcess}
            />
        </div>
    )
}
