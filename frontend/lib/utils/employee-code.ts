import { createClient } from '@supabase/supabase-js'

/**
 * Generates a unique employee code following the format: EMP{YYYY}{####}
 * Example: EMP20260001, EMP20260002, etc.
 * 
 * @param supabaseAdmin - Supabase client with service_role privileges
 * @returns Promise that resolves to the generated employee code
 */
export async function generateEmployeeCode(
    supabaseAdmin: ReturnType<typeof createClient>
): Promise<string> {
    const currentYear = new Date().getFullYear()
    const yearSuffix = currentYear.toString()
    const prefix = `EMP${yearSuffix}`

    try {
        // Query for the highest employee code for the current year
        const { data, error } = await supabaseAdmin
            .from('employees')
            .select('employee_code')
            .like('employee_code', `${prefix}%`)
            .order('employee_code', { ascending: false })
            .limit(1)

        if (error) {
            console.error('[generateEmployeeCode] Database query error:', error)
            throw new Error(`Failed to query employee codes: ${error.message}`)
        }

        let nextNumber = 1

        if (data && data.length > 0) {
            // Extract the numeric part from the last employee code
            const lastCode = (data[0] as any).employee_code
            const numericPart = lastCode.replace(prefix, '')
            const lastNumber = parseInt(numericPart, 10)

            if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1
            }
        }

        // Format with zero-padding (4 digits)
        const paddedNumber = nextNumber.toString().padStart(4, '0')
        const employeeCode = `${prefix}${paddedNumber}`

        return employeeCode
    } catch (error: any) {
        console.error('[generateEmployeeCode] Error:', error)
        throw new Error(`Employee code generation failed: ${error.message}`)
    }
}

/**
 * Validates that an employee code follows the correct format
 * @param code - The employee code to validate
 * @returns true if valid, false otherwise
 */
export function validateEmployeeCode(code: string): boolean {
    // Format: EMP{YYYY}{####}
    const pattern = /^EMP\d{4}\d{4}$/
    return pattern.test(code)
}
