import { Check, X } from "lucide-react"

interface PasswordRequirementsProps {
    password?: string
}

export function PasswordRequirements({ password = "" }: PasswordRequirementsProps) {
    const requirements = [
        { label: "At least 8 characters", valid: password.length >= 8 },
        { label: "At least one uppercase letter", valid: /[A-Z]/.test(password) },
        { label: "At least one lowercase letter", valid: /[a-z]/.test(password) },
        { label: "At least one number", valid: /[0-9]/.test(password) },
        { label: "At least one special character", valid: /[^A-Za-z0-9]/.test(password) },
    ]

    return (
        <div className="space-y-2 mt-2">
            <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
            <ul className="space-y-1">
                {requirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                        {req.valid ? (
                            <Check className="h-3 w-3 text-green-500" />
                        ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 ml-0.5 mr-0.5" />
                            // Using a dot for unmet, or X? User asked for "red/green indicators or checklist".
                            // I'll use a subtle dot for neutral/unmet and Check for met. 
                            // Or better: circle for unmet, check-circle for met.
                        )}
                        <span className={req.valid ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                            {req.label}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
