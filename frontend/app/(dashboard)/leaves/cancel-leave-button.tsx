'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cancelLeave } from './actions'
import { toast } from 'sonner'

interface CancelLeaveButtonProps {
    leaveId: number
}

export function CancelLeaveButton({ leaveId }: CancelLeaveButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleCancel() {
        setIsLoading(true)
        const formData = new FormData()
        formData.append('id', leaveId.toString())

        const result = await cancelLeave(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Leave request cancelled successfully')
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700"
        >
            {isLoading ? 'Cancelling...' : 'Cancel'}
        </Button>
    )
}
