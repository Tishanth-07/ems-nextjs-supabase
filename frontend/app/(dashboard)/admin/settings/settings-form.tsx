'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Loader2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { updateSettings } from './actions'

const companySchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    timezone: z.string(),
    currency: z.string(),
})

const leaveSchema = z.object({
    default_annual_days: z.coerce.number().min(0).max(365),
    grace_minutes: z.coerce.number().min(0).max(60),
})

const passwordSchema = z.object({
    min_length: z.coerce.number().min(6).max(128),
    require_uppercase: z.boolean(),
    require_lowercase: z.boolean(),
    require_number: z.boolean(),
    require_special: z.boolean(),
    expiry_days: z.coerce.number().min(0),
})

const notificationsSchema = z.object({
    email_enabled: z.boolean(),
    leave_approval_emails: z.boolean(),
    new_employee_emails: z.boolean(),
    system_alerts: z.boolean(),
})

const securitySchema = z.object({
    enforce_2fa_admins: z.boolean(),
    session_timeout_minutes: z.coerce.number().min(5).max(1440),
})

interface SettingsFormProps {
    initialSettings: any
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
    const [isLoading, setIsLoading] = useState('')

    const companyForm = useForm<z.infer<typeof companySchema>>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: initialSettings?.company?.name || 'My Company',
            timezone: initialSettings?.company?.timezone || 'UTC',
            currency: initialSettings?.company?.currency || 'USD',
        },
    })

    const leaveForm = useForm<z.infer<typeof leaveSchema>>({
        resolver: zodResolver(leaveSchema),
        defaultValues: {
            default_annual_days: initialSettings?.leave?.default_annual_days || 20,
            grace_minutes: initialSettings?.leave?.grace_minutes || 15,
        },
    })

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            min_length: initialSettings?.password?.min_length || 8,
            require_uppercase: initialSettings?.password?.require_uppercase ?? true,
            require_lowercase: initialSettings?.password?.require_lowercase ?? true,
            require_number: initialSettings?.password?.require_number ?? true,
            require_special: initialSettings?.password?.require_special ?? true,
            expiry_days: initialSettings?.password?.expiry_days || 90,
        },
    })

    const notificationsForm = useForm<z.infer<typeof notificationsSchema>>({
        resolver: zodResolver(notificationsSchema),
        defaultValues: {
            email_enabled: initialSettings?.notifications?.email_enabled ?? true,
            leave_approval_emails: initialSettings?.notifications?.leave_approval_emails ?? true,
            new_employee_emails: initialSettings?.notifications?.new_employee_emails ?? true,
            system_alerts: initialSettings?.notifications?.system_alerts ?? true,
        },
    })

    const securityForm = useForm<z.infer<typeof securitySchema>>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            enforce_2fa_admins: initialSettings?.security?.enforce_2fa_admins ?? false,
            session_timeout_minutes: initialSettings?.security?.session_timeout_minutes || 60,
        },
    })

    async function onSubmit(section: string, values: any) {
        setIsLoading(section)

        const result = await updateSettings(section, values)

        setIsLoading('')

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Settings updated successfully')
        }
    }

    return (
        <Tabs defaultValue="company" className="space-y-4">
            <TabsList>
                <TabsTrigger value="company">Company</TabsTrigger>
                <TabsTrigger value="leave">Leave & Attendance</TabsTrigger>
                <TabsTrigger value="password">Password Policy</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Company Settings */}
            <TabsContent value="company">
                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                        <CardDescription>
                            Update your company details and branding
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...companyForm}>
                            <form onSubmit={companyForm.handleSubmit((values) => onSubmit('company', values))} className="space-y-4">
                                <FormField
                                    control={companyForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="My Company" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={companyForm.control}
                                        name="timezone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Timezone</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="UTC">UTC</SelectItem>
                                                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                                                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                                                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                                                        <SelectItem value="Europe/London">London</SelectItem>
                                                        <SelectItem value="Asia/Kolkata">India</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={companyForm.control}
                                        name="currency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Currency</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="USD">USD ($)</SelectItem>
                                                        <SelectItem value="EUR">EUR (€)</SelectItem>
                                                        <SelectItem value="GBP">GBP (£)</SelectItem>
                                                        <SelectItem value="INR">INR (₹)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" disabled={isLoading === 'company'}>
                                    {isLoading === 'company' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Leave & Attendance Settings */}
            <TabsContent value="leave">
                <Card>
                    <CardHeader>
                        <CardTitle>Leave & Attendance Rules</CardTitle>
                        <CardDescription>
                            Configure leave policies and attendance settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...leaveForm}>
                            <form onSubmit={leaveForm.handleSubmit((values) => onSubmit('leave', values))} className="space-y-4">
                                <FormField
                                    control={leaveForm.control}
                                    name="default_annual_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Default Annual Leave Days</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Number of leave days all new employees receive annually
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={leaveForm.control}
                                    name="grace_minutes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Grace Period (minutes)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Grace period for late clock-ins without penalty
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLoading === 'leave'}>
                                    {isLoading === 'leave' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Password Policy */}
            <TabsContent value="password">
                <Card>
                    <CardHeader>
                        <CardTitle>Password Policy</CardTitle>
                        <CardDescription>
                            Set password requirements for all users
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit((values) => onSubmit('password', values))} className="space-y-4">
                                <FormField
                                    control={passwordForm.control}
                                    name="min_length"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Minimum Length</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-3">
                                    <FormField
                                        control={passwordForm.control}
                                        name="require_uppercase"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Require Uppercase</FormLabel>
                                                    <FormDescription>
                                                        Passwords must contain at least one uppercase letter
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="require_lowercase"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Require Lowercase</FormLabel>
                                                    <FormDescription>
                                                        Passwords must contain at least one lowercase letter
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="require_number"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Require Number</FormLabel>
                                                    <FormDescription>
                                                        Passwords must contain at least one number
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={passwordForm.control}
                                        name="require_special"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Require Special Character</FormLabel>
                                                    <FormDescription>
                                                        Passwords must contain at least one special character
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={passwordForm.control}
                                    name="expiry_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password Expiry (days)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Number of days before passwords expire (0 = never)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLoading === 'password'}>
                                    {isLoading === 'password' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                        <CardDescription>
                            Configure email notifications and alerts
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...notificationsForm}>
                            <form onSubmit={notificationsForm.handleSubmit((values) => onSubmit('notifications', values))} className="space-y-4">
                                <div className="space-y-3">
                                    <FormField
                                        control={notificationsForm.control}
                                        name="email_enabled"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Email Notifications</FormLabel>
                                                    <FormDescription>
                                                        Enable all email notifications
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={notificationsForm.control}
                                        name="leave_approval_emails"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Leave Approval Emails</FormLabel>
                                                    <FormDescription>
                                                        Notify managers when leave requests need approval
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={notificationsForm.control}
                                        name="new_employee_emails"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">New Employee Emails</FormLabel>
                                                    <FormDescription>
                                                        Send welcome emails to newly created employees
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={notificationsForm.control}
                                        name="system_alerts"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">System Alerts</FormLabel>
                                                    <FormDescription>
                                                        Critical system notifications and updates
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" disabled={isLoading === 'notifications'}>
                                    {isLoading === 'notifications' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Security */}
            <TabsContent value="security">
                <Card>
                    <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>
                            Configure security and authentication settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...securityForm}>
                            <form onSubmit={securityForm.handleSubmit((values) => onSubmit('security', values))} className="space-y-4">
                                <FormField
                                    control={securityForm.control}
                                    name="enforce_2fa_admins"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Enforce 2FA for Admins</FormLabel>
                                                <FormDescription>
                                                    Require two-factor authentication for admin users
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={securityForm.control}
                                    name="session_timeout_minutes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Session Timeout (minutes)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Automatically log out inactive users after this time
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLoading === 'security'}>
                                    {isLoading === 'security' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
