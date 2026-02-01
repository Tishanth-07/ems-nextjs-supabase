'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { assignToTeamAction } from '@/app/(dashboard)/manager/actions'

type Profile = Database['public']['Tables']['profiles']['Row']

export function AddTeamMemberDialog() {
    const [open, setOpen] = useState(false)
    const [candidates, setCandidates] = useState<Profile[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isAssigning, setIsAssigning] = useState(false)
    const supabase = createClient()

    // Fetch unassigned employees when dialog opens
    useEffect(() => {
        if (open) {
            fetchCandidates()
        }
    }, [open])

    const fetchCandidates = async () => {
        setIsLoading(true)
        try {
            // Get employees who don't have a manager assigned and are not admins/managers
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, department, photo_url, created_at')
                .is('manager_id', null)
                .eq('role', 'employee')
                .order('full_name', { ascending: true })

            if (error) {
                console.error('Error fetching candidates:', error)
                toast.error('Failed to load employees')
                return
            }

            setCandidates(data || [])
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load employees')
        } finally {
            setIsLoading(false)
        }
    }

    const handleAssign = async (employeeId: string, employeeName: string) => {
        setIsAssigning(true)
        try {
            const result = await assignToTeamAction(employeeId)

            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success(`${employeeName} added to your team`)

            // Remove from candidates list
            setCandidates((current) => current.filter((c) => c.id !== employeeId))

            // Close dialog if no more candidates
            if (candidates.length === 1) {
                setOpen(false)
            }
        } catch (error) {
            console.error('Error assigning:', error)
            toast.error('Failed to assign team member')
        } finally {
            setIsAssigning(false)
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team Member
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                        Select an employee to add to your team. Only unassigned employees are shown.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : candidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            No unassigned employees available
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {candidates.map((candidate) => (
                            <div
                                key={candidate.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={candidate.photo_url || undefined} />
                                        <AvatarFallback>
                                            {getInitials(candidate.full_name || 'UN')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{candidate.full_name}</p>
                                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {candidate.department && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {candidate.department}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                                {candidate.role}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleAssign(candidate.id, candidate.full_name || 'Employee')}
                                    disabled={isAssigning}
                                >
                                    {isAssigning ? (
                                        <>
                                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            Adding...
                                        </>
                                    ) : (
                                        'Add to Team'
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
