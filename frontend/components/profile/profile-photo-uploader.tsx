"use client"

import { useState, useRef } from "react"
import { Camera, Image as ImageIcon, Trash2, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProfilePhotoUploaderProps {
    currentPhotoUrl?: string | null
    userId: string
    userName: string
    className?: string
    onPhotoUpdated?: (url: string | null) => void // To notify parent
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
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle File Select
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB")
            return
        }

        // Preview
        const objectUrl = URL.createObjectURL(file)
        setPreviewUrl(objectUrl)

        // TODO: Trigger Upload Server Action (Phase 4)
        toast.info("Selected for upload (Implementation coming in Phase 4)")

        // Cleanup
        return () => URL.revokeObjectURL(objectUrl)
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const handleRemovePhoto = async () => {
        // TODO: Trigger Remove Server Action (Phase 4)
        setPreviewUrl(null)
        toast.info("Removed photo (Implementation coming in Phase 4)")
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

                {/* Quick overlay actions if needed, or kept simple sidebar */}
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
                        onClick={() => toast.info("Camera capture coming in Phase 3")}
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
        </div>
    )
}
