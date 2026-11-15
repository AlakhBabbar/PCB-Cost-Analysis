import {
  ClipboardList, Factory, FlaskConical, History, House, Layers, Package, Percent,
  ShoppingCart, Sigma, SlidersHorizontal, Store, Tags, UserCog, Users,
} from 'lucide-react'

export const ROLE_RANK = { staff: 0, manager: 1, owner: 2 }
export const roleAtLeast = (role, min = 'staff') => (ROLE_RANK[role] ?? 2) >= ROLE_RANK[min]

// Single registry for the menu, page titles and role checks. path is relative to /admin.
export const NAV = [
  { path: '', label: 'Home', icon: House, group: null, role: 'staff' },
  { path: 'orders', label: 'Orders', icon: Package, group: 'Sales', role: 'staff' },
  { path: 'abandoned', label: 'Abandoned checkouts', icon: ShoppingCart, group: 'Sales', role: 'staff' },
  { path: 'requests', label: 'Quote requests', icon: ClipboardList, group: 'Sales', role: 'staff' },
  { path: 'customers', label: 'Customers', icon: Users, group: 'Sales', role: 'staff' },
  { path: 'files', label: 'Files', icon: Layers, group: 'Sales', role: 'staff' },
  { path: 'pricing/options', label: 'Buyer options', icon: SlidersHorizontal, group: 'Pricing', role: 'manager' },
  { path: 'pricing/rules', label: 'Price rules', icon: Percent, group: 'Pricing', role: 'manager' },
  { path: 'pricing/costs', label: 'Factory costs', icon: Factory, group: 'Pricing', role: 'manager' },
  { path: 'pricing/formulas', label: 'Formulas', icon: Sigma, group: 'Pricing', role: 'manager', tag: 'Advanced' },
  { path: 'pricing/tester', label: 'Price tester', icon: FlaskConical, group: 'Pricing', role: 'manager' },
  { path: 'team', label: 'Team', icon: UserCog, group: 'Settings', role: 'owner' },
  { path: 'activity', label: 'Activity', icon: History, group: 'Settings', role: 'manager' },
  { path: 'store', label: 'Store', icon: Store, group: 'Settings', role: 'staff' },
]

export const GROUPS = ['Sales', 'Pricing', 'Settings']

// Phone bottom bar. `match` marks the tab active for every path under it.
export const TABS = [
  { path: '', label: 'Home', icon: House, role: 'staff' },
  { path: 'orders', label: 'Orders', icon: Package, role: 'staff' },
  { path: 'pricing/options', match: 'pricing', label: 'Pricing', icon: Tags, role: 'manager' },
]

export const href = (path) => (path ? `/admin/${path}` : '/admin')

export const navFor = (role) => NAV.filter((n) => roleAtLeast(role, n.role))

export function entryFor(pathname) {
  const rest = pathname.replace(/^\/admin\/?/, '').replace(/\/$/, '')
  return NAV.find((n) => n.path === rest) ?? NAV.find((n) => n.path && rest.startsWith(`${n.path}/`)) ?? (rest ? null : NAV[0])
}

export const isActive = (pathname, path, match) => {
  const rest = pathname.replace(/^\/admin\/?/, '')
  const base = match ?? path
  return base ? rest === base || rest.startsWith(`${base}/`) : rest === ''
}
