import { ActionType } from '@/lib/audit'

// Define permissions map
// Role -> Allowed Actions
const PERMISSIONS: Record<string, ActionType[]> = {
    'ADMIN': [
        'CREATE_PIECE', 'UPDATE_PIECE', 'APPROVE_PIECE', 'REJECT_PIECE',
        'RESTORE_VERSION', 'CREATE_COMMENT', 'RESOLVE_COMMENT',
        'UPDATE_BRAND_KIT', 'RUN_QA'
    ],
    'MANAGER': [
        'CREATE_PIECE', 'UPDATE_PIECE', 'APPROVE_PIECE', 'REJECT_PIECE',
        'RESTORE_VERSION', 'CREATE_COMMENT', 'RESOLVE_COMMENT',
        'UPDATE_BRAND_KIT', 'RUN_QA'
    ],
    'REVIEWER': [
        'APPROVE_PIECE', 'REJECT_PIECE', 'CREATE_COMMENT', 'RESOLVE_COMMENT'
    ],
    'CREATOR': [
        'CREATE_PIECE', 'UPDATE_PIECE', 'RESTORE_VERSION', 'CREATE_COMMENT', 'RESOLVE_COMMENT', 'RUN_QA'
    ],
    'CLIENT': [
        'APPROVE_PIECE', 'REJECT_PIECE', 'CREATE_COMMENT'
    ]
}

export function canUser(role: string, action: ActionType): boolean {
    const allowed = PERMISSIONS[role] || []
    return allowed.includes(action)
}
