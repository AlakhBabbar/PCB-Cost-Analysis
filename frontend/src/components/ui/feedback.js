import { createContext, useContext } from 'react'

export const ToastContext = createContext(() => {})
export const ConfirmContext = createContext(async () => window.confirm('Are you sure?'))

// toast('Saved') or toast('Could not save', { tone: 'alert', action: { label, onClick } })
export const useToast = () => useContext(ToastContext)

// const ok = await confirm({ title, message, confirmLabel, tone: 'danger' })
export const useConfirm = () => useContext(ConfirmContext)
