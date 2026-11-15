import { createContext, useContext } from 'react'

export const AdminContext = createContext(null)

// { token, user, role, can(minRole), signOut }
export const useAdmin = () => useContext(AdminContext)
