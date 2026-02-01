'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { AddTeamMemberDialog } from './add-team-member-dialog'
import { Skeleton } from '@/components/ui/skeleton'

type TeamMember = Database['public']['Tables']['profiles']['Row']

interface TeamListProps {
    initialTeam: TeamMember[]
    managerId: string
}

export function TeamList({ initialTeam, managerId }: TeamListProps) {
    const [team, setTeam] = useState<TeamMember[]>(initialTeam)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    // Subscribe to real-time changes
    useEffect(() => {
        const channel = supabase
            .channel('team-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                    filter: `manager_id=eq.${managerId}`,
                },
                (payload) => {
                    console.log('Team member update:', payload)

                    if (payload.eventType === 'INSERT') {
                        setTeam((current) => [...current, payload.new as TeamMember])
                    } else if (payload.eventType === 'UPDATE') {
                        setTeam((current) =>
                            current.map((member) =>
                                member.id === payload.new.id ? (payload.new as TeamMember) : member
                            )
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setTeam((current) => current.filter((member) => member.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [managerId, supabase])

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    if (isLoading) {
        return <TeamListSkeleton />
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            My Team
                        </CardTitle>
                        <CardDescription>
                            Manage your team members and track their progress
                        </CardDescription>
                    </div>
                    <AddTeamMemberDialog />
                </div>
            </CardHeader>
            <CardContent>
                {team.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No team members yet</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Add employees to your team to get started
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {team.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={member.photo_url || undefined} />
                                                    <AvatarFallback>
                                                        {getInitials(member.full_name || 'UN')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{member.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>{member.department || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{member.role}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(member.created_at || '').toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function TeamListSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
