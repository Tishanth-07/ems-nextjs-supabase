export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            attendance_logs: {
                Row: {
                    id: number
                    employee_id: string
                    date: string
                    check_in: string | null
                    check_out: string | null
                    status: string | null
                    created_at: string
                    clock_in: string | null
                    clock_out: string | null
                    duration: number | null
                }
                Insert: {
                    id?: never
                    employee_id: string
                    date: string
                    check_in?: string | null
                    check_out?: string | null
                    status?: string | null
                    created_at?: string
                    clock_in?: string | null
                    clock_out?: string | null
                    duration?: number | null
                }
                Update: {
                    id?: never
                    employee_id?: string
                    date?: string
                    check_in?: string | null
                    check_out?: string | null
                    status?: string | null
                    created_at?: string
                    clock_in?: string | null
                    clock_out?: string | null
                    duration?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "attendance_logs_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            email_verifications: {
                Row: {
                    id: string
                    user_id: string | null
                    email: string
                    code: string
                    created_at: string
                    expires_at: string
                    verified: boolean
                    attempts: number
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    email: string
                    code: string
                    created_at?: string
                    expires_at: string
                    verified?: boolean
                    attempts?: number
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    email?: string
                    code?: string
                    created_at?: string
                    expires_at?: string
                    verified?: boolean
                    attempts?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "email_verifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }

            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'admin' | 'manager' | 'employee'
                    department: string | null
                    photo_url: string | null
                    created_at: string
                    updated_at: string
                    username: string | null
                    is_verified: boolean
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: 'admin' | 'manager' | 'employee'
                    department?: string | null
                    photo_url?: string | null
                    created_at?: string
                    updated_at?: string
                    username?: string | null
                    is_verified?: boolean
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: 'admin' | 'manager' | 'employee'
                    department?: string | null
                    photo_url?: string | null
                    created_at?: string
                    updated_at?: string
                    username?: string | null
                    is_verified?: boolean
                }
                Relationships: []
            }
            settings: {
                Row: {
                    id: string
                    config: Json
                    created_at: string
                    updated_at: string
                    updated_by: string | null
                }
                Insert: {
                    id?: string
                    config?: Json
                    created_at?: string
                    updated_at?: string
                    updated_by?: string | null
                }
                Update: {
                    id?: string
                    config?: Json
                    created_at?: string
                    updated_at?: string
                    updated_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "settings_updated_by_fkey"
                        columns: ["updated_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            payroll_summaries: {
                Row: {
                    id: number
                    employee_id: string
                    pay_period_start: string
                    pay_period_end: string
                    total_hours: number
                    gross_pay: number
                    net_pay: number
                    created_at: string
                }
                Insert: {
                    id?: never
                    employee_id: string
                    pay_period_start: string
                    pay_period_end: string
                    total_hours?: number
                    gross_pay?: number
                    net_pay?: number
                    created_at?: string
                }
                Update: {
                    id?: never
                    employee_id?: string
                    pay_period_start?: string
                    pay_period_end?: string
                    total_hours?: number
                    gross_pay?: number
                    net_pay?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payroll_summaries_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            attendance_status: "present" | "absent" | "half_day" | "on_leave"
            employee_status: "active" | "resigned" | "terminated" | "on_leave"
            leave_status: "pending" | "approved" | "rejected" | "cancelled"
            user_role: "admin" | "manager" | "employee"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
