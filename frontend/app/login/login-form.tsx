"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { login, signup } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoginFormData, loginSchema } from "@/lib/schema/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function LoginForm() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSignIn(data: LoginFormData) {
        setLoading(true)
        const formData = new FormData()
        formData.append("email", data.email)
        formData.append("password", data.password)

        // Call server action
        await login(formData)
        // Server action redirects on success, so we don't need manual redirect here mostly
        // But if we wanted to handle errors client side without redirecting for errors:
        // The server action currently redirects or returns nothing? Let's check actions.ts
        setLoading(false)
    }

    async function onSignUp(data: LoginFormData) {
        setLoading(true)
        const formData = new FormData()
        formData.append("email", data.email)
        formData.append("password", data.password)

        await signup(formData)
        setLoading(false)
        toast.success("Check your email for the confirmation link.")
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>
                    Enter your email to sign in to your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="name@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <a href="/forgot-password" class="text-sm font-medium text-primary hover:underline">
                                            Forgot password?
                                        </a>
                                    </div>
                                    <FormControl>
                                        <PasswordInput placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex flex-col gap-2 pt-2">
                            <Button type="button" onClick={form.handleSubmit(onSignIn)} disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Or
                                    </span>
                                </div>
                            </div>
                            <Button type="button" variant="outline" onClick={form.handleSubmit(onSignUp)} disabled={loading}>
                                {loading ? "Creating account..." : "Create an account"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
