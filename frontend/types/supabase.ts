export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            attendance_logs: {
                Row: {
                    clock_in: string | null
                    clock_out: string | null
                    created_at: string | null
                    date: string
                    duration: number | null
                    employee_id: string
                    id: number
                    status: Database["public"]["Enums"]["attendance_status"] | null
                }
                Insert: {
                    clock_in?: string | null
                    clock_out?: string | null
                    created_at?: string | null
                    date?: string
                    duration?: number | null
                    employee_id: string
                    id?: never
                    status?: Database["public"]["Enums"]["attendance_status"] | null
                }
                Update: {
                    clock_in?: string | null
                    clock_out?: string | null
                    created_at?: string | null
                    date?: string
                    duration?: number | null
                    employee_id?: string
                    id?: never
                    status?: Database["public"]["Enums"]["attendance_status"] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "attendance_logs_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            email_verifications: {
                Row: {
                    attempts: number | null
                    code: string
                    created_at: string
                    email: string
                    expires_at: string
                    id: string
                    user_id: string | null
                    verified: boolean | null
                }
                Insert: {
                    attempts?: number | null
                    code: string
                    created_at?: string
                    email: string
                    expires_at: string
                    id?: string
                    user_id?: string | null
                    verified?: boolean | null
                }
                Update: {
                    attempts?: number | null
                    code?: string
                    created_at?: string
                    email?: string
                    expires_at?: string
                    id?: string
                    user_id?: string | null
                    verified?: boolean | null
                }
                Relationships: [
                    {
                        foreignKeyName: "email_verifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            employees: {
                Row: {
                    contact_number: string | null
                    created_at: string | null
                    date_of_birth: string | null
                    date_of_joining: string | null
                    designation: string | null
                    employee_id: string
                    id: number
                    profile_id: string
                    status: Database["public"]["Enums"]["employee_status"] | null
                    updated_at: string | null
                }
                Insert: {
                    contact_number?: string | null
                    created_at?: string | null
                    date_of_birth?: string | null
                    date_of_joining?: string | null
                    designation?: string | null
                    employee_id: string
                    id?: never
                    profile_id: string
                    status?: Database["public"]["Enums"]["employee_status"] | null
                    updated_at?: string | null
                }
                Update: {
                    contact_number?: string | null
                    created_at?: string | null
                    date_of_birth?: string | null
                    date_of_joining?: string | null
                    designation?: string | null
                    employee_id?: string
                    id?: never
                    profile_id?: string
                    status?: Database["public"]["Enums"]["employee_status"] | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "employees_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            leaves: {
                Row: {
                    approved_by: string | null
                    created_at: string
                    employee_id: string
                    end_date: string
                    id: number
                    reason: string | null
                    start_date: string
                    status: Database["public"]["Enums"]["leave_status"] | null
                    type: string
                    updated_at: string | null
                }
                Insert: {
                    approved_by?: string | null
                    created_at?: string
                    employee_id: string
                    end_date: string
                    id?: never
                    reason?: string | null
                    start_date: string
                    status?: Database["public"]["Enums"]["leave_status"] | null
                    type: string
                    updated_at?: string | null
                }
                Update: {
                    approved_by?: string | null
                    created_at?: string
                    employee_id?: string
                    end_date?: string
                    id?: never
                    reason?: string | null
                    start_date?: string
                    status?: Database["public"]["Enums"]["leave_status"] | null
                    type?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "leaves_approved_by_fkey"
                        columns: ["approved_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "leaves_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payroll_summaries: {
                Row: {
                    bonuses: number | null
                    created_at: string | null
                    deductions: number | null
                    employee_id: string
                    gross_salary: number
                    id: number
                    month: number
                    net_salary: number | null
                    updated_at: string | null
                    year: number
                }
                Insert: {
                    bonuses?: number | null
                    created_at?: string | null
                    deductions?: number | null
                    employee_id: string
                    gross_salary: number
                    id?: never
                    month: number
                    net_salary?: number | null
                    updated_at?: string | null
                    year: number
                }
                Update: {
                    bonuses?: number | null
                    created_at?: string | null
                    deductions?: number | null
                    employee_id?: string
                    gross_salary?: number
                    id?: never
                    month?: number
                    net_salary?: number | null
                    updated_at?: string | null
                    year?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "payroll_summaries_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    created_at: string | null
                    department: string | null
                    email: string
                    full_name: string | null
                    id: string
                    is_verified: boolean | null
                    manager_id: string | null
                    photo_url: string | null
                    role: Database["public"]["Enums"]["user_role"]
                    updated_at: string | null
                    username: string | null
                }
                Insert: {
                    created_at?: string | null
                    department?: string | null
                    email: string
                    full_name?: string | null
                    id: string
                    is_verified?: boolean | null
                    manager_id?: string | null
                    photo_url?: string | null
                    role?: Database["public"]["Enums"]["user_role"]
                    updated_at?: string | null
                    username?: string | null
                }
                Update: {
                    created_at?: string | null
                    department?: string | null
                    email?: string
                    full_name?: string | null
                    id?: string
                    is_verified?: boolean | null
                    manager_id?: string | null
                    photo_url?: string | null
                    role?: Database["public"]["Enums"]["user_role"]
                    updated_at?: string | null
                    username?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profiles_manager_id_fkey"
                        columns: ["manager_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            settings: {
                Row: {
                    config: Json
                    created_at: string | null
                    id: string
                    updated_at: string | null
                    updated_by: string | null
                }
                Insert: {
                    config?: Json
                    created_at?: string | null
                    id?: string
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Update: {
                    config?: Json
                    created_at?: string | null
                    id?: string
                    updated_at?: string | null
                    updated_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "settings_updated_by_fkey"
                        columns: ["updated_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            attendance_status: ["present", "absent", "half_day", "on_leave"],
            employee_status: ["active", "resigned", "terminated", "on_leave"],
            leave_status: ["pending", "approved", "rejected", "cancelled"],
            user_role: ["admin", "manager", "employee"],
        },
    },
} as const
