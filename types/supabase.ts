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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'manager' | 'employee'
          department: string | null
          manager_id: string | null
          photo_url: string | null
          username: string | null
          is_verified: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'employee'
          department?: string | null
          manager_id?: string | null
          photo_url?: string | null
          username?: string | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'manager' | 'employee'
          department?: string | null
          manager_id?: string | null
          photo_url?: string | null
          username?: string | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          profile_id: string
          employee_code: string
          hire_date: string
          status: 'active' | 'resigned' | 'terminated' | 'on_leave'
          position: string | null
          salary_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          employee_code: string
          hire_date?: string
          status?: 'active' | 'resigned' | 'terminated' | 'on_leave'
          position?: string | null
          salary_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          employee_code?: string
          hire_date?: string
          status?: 'active' | 'resigned' | 'terminated' | 'on_leave'
          position?: string | null
          salary_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance_logs: {
        Row: {
          id: number
          employee_id: string
          date: string
          clock_in: string | null
          clock_out: string | null
          duration: number | null
          status: 'present' | 'absent' | 'half_day' | 'on_leave'
          created_at: string
        }
        Insert: {
          id?: number
          employee_id: string
          date?: string
          clock_in?: string | null
          clock_out?: string | null
          duration?: number | null
          status?: 'present' | 'absent' | 'half_day' | 'on_leave'
          created_at?: string
        }
        Update: {
          id?: number
          employee_id?: string
          date?: string
          clock_in?: string | null
          clock_out?: string | null
          duration?: number | null
          status?: 'present' | 'absent' | 'half_day' | 'on_leave'
          created_at?: string
        }
      }
      leaves: {
        Row: {
          id: number
          employee_id: string
          type: string
          start_date: string
          end_date: string
          reason: string | null
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          employee_id: string
          type: string
          start_date: string
          end_date: string
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          employee_id?: string
          type?: string
          start_date?: string
          end_date?: string
          reason?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payroll_summaries: {
        Row: {
          id: number
          employee_id: string
          pay_period_start: string
          pay_period_end: string
          total_hours: number | null
          gross_pay: number | null
          net_pay: number | null
          created_at: string
        }
        Insert: {
          id?: number
          employee_id: string
          pay_period_start: string
          pay_period_end: string
          total_hours?: number | null
          gross_pay?: number | null
          net_pay?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          employee_id?: string
          pay_period_start?: string
          pay_period_end?: string
          total_hours?: number | null
          gross_pay?: number | null
          net_pay?: number | null
          created_at?: string
        }
      }
      email_verifications: {
        Row: {
          id: string
          email: string
          otp: string
          created_at: string
          expires_at: string
          verified: boolean | null
        }
        Insert: {
          id?: string
          email: string
          otp: string
          created_at?: string
          expires_at: string
          verified?: boolean | null
        }
        Update: {
          id?: string
          email?: string
          otp?: string
          created_at?: string
          expires_at?: string
          verified?: boolean | null
        }
      }
    }
  }
}
