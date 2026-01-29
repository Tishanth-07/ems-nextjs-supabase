import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbProps {
    items: {
        label: string
        href?: string
    }[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
            </Link>
            {items.map((item, index) => (
                <div key={index} className="flex items-center">
                    <ChevronRight className="h-4 w-4 mx-2" />
                    {item.href ? (
                        <Link href={item.href} className="hover:text-foreground transition-colors">
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-foreground font-medium">{item.label}</span>
                    )}
                </div>
            ))}
        </nav>
    )
}
