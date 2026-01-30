"use client"

import { useState, useRef, useCallback } from "react"
import Webcam from "react-webcam"
import { Camera, RefreshCw, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface CameraCaptureModalProps {
    isOpen: boolean
    onClose: () => void
    onCapture: (file: File) => void
}

export function CameraCaptureModal({ isOpen, onClose, onCapture }: CameraCaptureModalProps) {
    const webcamRef = useRef<Webcam>(null)
    const [imgSrc, setImgSrc] = useState<string | null>(null)
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user")

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot()
        if (imageSrc) {
            setImgSrc(imageSrc)
        }
    }, [webcamRef])

    const retake = () => {
        setImgSrc(null)
    }

    const confirmCapture = async () => {
        if (!imgSrc) return

        // Convert base64 to File
        const res = await fetch(imgSrc)
        const blob = await res.blob()
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" })

        onCapture(file)
        onClose()
        setImgSrc(null) // Reset
    }

    const toggleCamera = () => {
        setFacingMode(prev => (prev === "user" ? "environment" : "user"))
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Take Photo</DialogTitle>
                </DialogHeader>

                <div className="relative aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
                    {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc} alt="Captured" className="w-full h-full object-cover transform scale-x-[-1]" />
                        // Note: scale-x[-1] mirrors it like a mirror, usually desired for selfies. 
                        // But after capture, users expect to see what others see? 
                        // Usually user facing camera preview is mirrored, but the result is not.
                        // However, for profile photos, people often prefer the mirrored look they saw.
                        // Let's keep it consistent: preview is mirrored if user facing.
                    ) : (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode }}
                            className={cn(
                                "w-full h-full object-cover",
                                facingMode === "user" && "transform scale-x-[-1]"
                            )}
                        />
                    )}
                </div>

                <DialogFooter className="sm:justify-between gap-2">
                    {!imgSrc ? (
                        <>
                            <Button variant="outline" size="icon" onClick={toggleCamera} title="Switch Camera">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button onClick={capture} className="flex-1">
                                <Camera className="mr-2 h-4 w-4" /> Capture
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={retake} className="flex-1">
                                <RefreshCw className="mr-2 h-4 w-4" /> Retake
                            </Button>
                            <Button onClick={confirmCapture} className="flex-1">
                                <Check className="mr-2 h-4 w-4" /> Use Photo
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
