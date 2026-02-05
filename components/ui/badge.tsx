import { cn } from '@/lib/utils'

interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    children: React.ReactNode
    className?: string
}

const variantStyles = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-primary/10 text-primary border-primary/20',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                variantStyles[variant],
                className
            )}
        >
            {children}
        </span>
    )
}

// Status-specific badges
export function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { variant: BadgeProps['variant']; label: string }> = {
        IDEA: { variant: 'info', label: 'Idea' },
        DRAFT: { variant: 'default', label: 'Borrador' },
        PENDING_REVIEW: { variant: 'warning', label: 'Pendiente' },
        APPROVED: { variant: 'success', label: 'Aprobado' },
        SCHEDULED: { variant: 'info', label: 'Programado' },
        PUBLISHED: { variant: 'success', label: 'Publicado' },
        ARCHIVED: { variant: 'default', label: 'Archivado' },
        // Month statuses
        GENERATED: { variant: 'info', label: 'Generado' },
        IN_REVIEW: { variant: 'warning', label: 'En Revisión' },
        LOCKED: { variant: 'success', label: 'Bloqueado' },
        EXPORTED: { variant: 'success', label: 'Exportado' },
    }

    const { variant, label } = config[status] || { variant: 'default', label: status }

    return <Badge variant={variant}>{label}</Badge>
}
