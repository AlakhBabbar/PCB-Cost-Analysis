export const ROLES = [
  { value: 'owner', label: 'Owner', can: 'Everything, including letting people in, changing roles and removing people.' },
  { value: 'manager', label: 'Manager', can: 'Sales pages and every pricing page.' },
  { value: 'staff', label: 'Staff', can: 'Sales pages only: orders, checkouts, quote requests, customers and files.' },
]

export const roleLabel = (v) => ROLES.find((r) => r.value === v)?.label ?? v
