'use client'

import { requestLeave } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useState } from 'react'

export function LeaveRequestForm() {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = await requestLeave(formData)
        setLoading(false)
        if (result?.error) toast.error(result.error)
        else {
            toast.success('Leave requested successfully')
            // Reset form if needed or rely on action reset
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Request Leave</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Leave Type</label>
                        <select name="type" className="w-full rounded-md border p-2 bg-transparent" required>
                            <option value="Vacation">Vacation</option>
                            <option value="Sick">Sick Leave</option>
                            <option value="Personal">Personal</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input type="date" name="start_date" className="w-full rounded-md border p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input type="date" name="end_date" className="w-full rounded-md border p-2" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <textarea name="reason" className="w-full rounded-md border p-2" rows={3}></textarea>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
