'use client'

import { processLeave } from './actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

export function ApprovalActions({ id }: { id: string }) {
    const [loading, setLoading] = useState(false)

    async function handleApprove() {
        setLoading(true)
        const formData = new FormData()
        formData.append('id', id)
        formData.append('action', 'approve')
        const result = await processLeave(formData)
        setLoading(false)
        if (result?.error) toast.error(result.error)
        else toast.success('Approved')
    }

    async function handleReject() {
        setLoading(true)
        const formData = new FormData()
        formData.append('id', id)
        formData.append('action', 'reject')
        const result = await processLeave(formData)
        setLoading(false)
        if (result?.error) toast.error(result.error)
        else toast.success('Rejected')
    }

    return (
        <div className="flex justify-end gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={loading}>
                Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={loading}>
                Reject
            </Button>
        </div>
    )
}
