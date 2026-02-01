
import { cn } from './utils'
import { describe, it, expect } from 'vitest'

describe('cn utility', () => {
    it('should merge class names correctly', () => {
        expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
    })

    it('should handle conditional classes', () => {
        expect(cn('bg-red-500', false && 'text-white', 'p-4')).toBe('bg-red-500 p-4')
    })

    it('should resolve tailwind conflicts', () => {
        expect(cn('p-4', 'p-8')).toBe('p-8') // tailwind-merge behavior
    })
})
