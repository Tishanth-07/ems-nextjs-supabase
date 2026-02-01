
import { render, screen } from '@testing-library/react'
import { DashboardSidebar } from './dashboard-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { describe, it, expect, vi } from 'vitest'

// Mock dependencies
vi.mock('next/navigation', () => ({
    usePathname: () => '/manager',
}))

vi.mock('next/link', () => ({
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}))

vi.mock('@/app/auth/actions', () => ({
    signOutAction: vi.fn(),
}))

vi.mock('next/image', () => ({
    default: (props: any) => <img {...props} />
}))

// Mock matchMedia for Sidebar responsiveness
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

describe('DashboardSidebar', () => {
    it('renders branding correctly', () => {
        render(
            <SidebarProvider>
                <DashboardSidebar user={null} userRole="manager" />
            </SidebarProvider>
        )

        // Check for new branding
        // The logo alt text
        expect(screen.getByAltText('StaffSync')).toBeDefined()
        // The text 'StaffSync'
        expect(screen.getByText('StaffSync')).toBeDefined()
        // The text 'Management'
        expect(screen.getByText('Management')).toBeDefined()
    })
})
