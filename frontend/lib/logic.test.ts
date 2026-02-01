
import { describe, it, expect } from 'vitest'

// Replicating the logic from page.tsx for independent verification
function calculateOvertime(durationMinutes: number) {
    const STANDARD_HOURS = 8
    const workedHours = durationMinutes / 60
    if (workedHours > STANDARD_HOURS) {
        return workedHours - STANDARD_HOURS
    }
    return 0
}

describe('Overtime Logic', () => {
    it('should return 0 overtime for standard 8 hours (480 mins)', () => {
        expect(calculateOvertime(480)).toBe(0)
    })

    it('should return 0 overtime for under 8 hours', () => {
        expect(calculateOvertime(400)).toBe(0)
    })

    it('should calculate correct overtime for 9 hours (540 mins)', () => {
        expect(calculateOvertime(540)).toBe(1)
    })

    it('should handle decimal hours correctly', () => {
        // 8.5 hours = 510 mins
        expect(calculateOvertime(510)).toBe(0.5)
    })
})
