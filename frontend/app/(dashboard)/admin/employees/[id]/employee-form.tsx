'use client'

import { updateEmployeeAction } from '../actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'

export function EmployeeForm({ employee }: { employee: any }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = await updateEmployeeAction(null, formData)
        setLoading(false)

        if (result?.error) toast.error(result.error)
        else toast.success('Employee updated successfully')
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={employee.id} />

            <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <input
                    name="position"
                    defaultValue={employee.position || ''}
                    className="w-full rounded-md border p-2 bg-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Salary Rate</label>
                <input
                    name="salary_rate"
                    type="number"
                    step="0.01"
                    defaultValue={employee.salary_rate || 0}
                    className="w-full rounded-md border p-2 bg-transparent"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="status" defaultValue={employee.status} className="w-full rounded-md border p-2 bg-transparent">
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                    <option value="resigned">Resigned</option>
                </select>
            </div>

            <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}
