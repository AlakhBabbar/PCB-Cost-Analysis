# Frontend kit

What every admin page builds from. Import from the barrels: `components/ui`, `components/motion`, `components/art`, plus `lib/format`, `lib/useApi`, `lib/useMediaQuery`.

## UI (`components/ui`)
- `Button`: `variant` (primary|secondary|ghost|danger), `size` (sm|md|lg), `icon`, `iconRight`, `loading`, `to` (router link) or `href`.
- `IconButton`: `icon`, `label` (required), `variant`, `size`, `to`.
- `Card`: `title`, `description`, `actions`, `footer`, `padding={false}` for tables.
- `Badge`: `tone` (neutral|good|wait|alert|info), `dot`, `icon`.
- `Input`: `prefix`, `suffix` (the unit). `Textarea`: `mono`. `Select`: `options` (strings or `{value,label}`), `placeholder`. `Switch`: `checked`, `onChange(bool)`, `label`.
- `Field`: `label`, `help`, `error`, `info` (adds an InfoTip), `badge`, `aside`, `htmlFor`.
- `Tabs`: `items [{value,label,count,icon,to}]`, `value`, `onChange`. Use `to` for router tabs. `SegmentedControl`: `options`, `value`, `onChange`, `size`.
- `Dialog` (alias `Sheet`): `open`, `onClose`, `title`, `description`, `footer`, `size` (sm|md|lg), `dismissable`. Dialog on desktop, bottom sheet on phones. `data-autofocus` marks the first focus target.
- `DataTable`: `columns [{key, header, render(row), align:'right', width, className, hideOnPhone}]`, `rows`, `rowKey`, `loading`, `skeletonRows`, `empty`, `onRowClick(row)`, `renderCard(row)` for phones, `groupBy(row)` (use `dayGroup`), `toolbar`, `footer`.
- `Pagination`: `page` (from 1), `size`, `total`, `onPage`. `SearchInput`: `value`, `onChange` (debounced). `FilterChips`: `options [{value,label,count}]`, `value`, `onChange`, `multiple`.
- `Skeleton`, `Spinner`, `InfoTip` (`text`, `title`).
- `EmptyState`: `art`, `title`, `description`, `action`, `compact`.
- `Stat`: `label`, `value` (numbers count up), `format`, `delta`, `spark`, `detail`.
- `KeyValue`: `items [{label,value,hint}]`. `Timeline`: `items [{id,title,time,detail,tone}]`.
- `Money`: `value`, `compact`, `round`. `RelativeTime`: `value` (iso).
- `PageHeader`: `title`, `description`, `back {to,label}`, `actions`, `badges`, `children`.
- `SaveBar`: `dirty`, `busy`, `message`, `onDiscard`, `onSave`, `extra {label,onClick}`.
- `Page` (`width` "full" or "narrow"), `Columns` (`main`, `side`).
- `inputClass`, `linkClass`.

## Toast and confirm
```js
const toast = useToast(); toast('Saved'); toast('Could not save', { tone: 'alert' })
const confirm = useConfirm(); if (await confirm({ title, message, confirmLabel: 'Remove', tone: 'danger' })) { }
```

## Motion (`components/motion`)
`FadeIn` (`delay`, `y`, `as`), `Stagger` + `StaggerItem i={index}`, `PageTransition`, `Pop`, `CountUp` (`value`, `format`), `DrawCheck`, `useShake()` gives `[controls, shake]`, `usePrefersReducedMotion`, tokens `spring.{panel,sheet,row,ink,pop}`, `ease`, `staggerDelay`, `rowIn`. Use `m.*` from framer-motion, never `motion.*` (LazyMotion is strict).

## Art (`components/art`)
`EmptyOrders`, `EmptyAbandoned`, `EmptyRequests`, `EmptyCustomers`, `EmptyFiles`, `EmptyActivity`, `SetupNeeded`, `BoardStack` (each takes `size`). Charts: `Sparkline` (`data`), `BarChart`, `AreaChart` (`data [{label,value}]`, `format`, `height`). `Frame`, `Accent`, `Pad` are the building blocks for new art in the same monoline style.

## lib
- `format`: `inr`, `inrRound`, `inrCompact`, `pct`, `count`, `ago`, `day`, `shortDay`, `dateTime`, `dayGroup`, `fileSize`, `initials`.
- `useApi(fn, deps)` gives `{data, error, loading, reload, setData}`.
- `useIsDesktop()` is true from 768px.
- `api/client`: `request(path, {method, body, token, sessionId, query})`, `qs()`, `ApiError` (`status`, `detail`). A 401 on a call with a token signs the user out.

## Token and role
`const { token, user, role, can, signOut } = useAdmin()` from `features/admin/shell/AdminContext`. `can('manager')` checks the minimum role.

## Routes to files (`features/admin/`)
| Route | File |
|---|---|
| home | `home/HomePage` |
| `orders`, `orders/:id` | `orders/OrdersPage`, `orders/OrderDetailPage` |
| `abandoned`, `requests` | `leads/AbandonedPage`, `leads/RequestsPage` |
| `customers` | `customers/CustomersPage` |
| `files` | `files/FilesPage` |
| `pricing/*` | `pricing/PricingSection` (owns its sub routes; the page transition key is `pricing` for all of them so a shared draft survives) |
| `team`, `activity`, `store` | `settings/TeamPage`, `settings/ActivityPage`, `settings/StorePage` |

The menu lives in `shell/nav.js`.

## Tailwind tokens
`bg-canvas`, `bg-sunken`, `border-line`, `border-line-strong`, `text-ink`, `text-muted`, `text-faint`, `text-accent`, `bg-accent`, `bg-accent-soft`, `shadow-hair`, `shadow-float`, `.press`.
Wrap each page in `<Page>` (the layout handles padding). `gap-4 md:gap-5` between cards. Text, phone then desktop: body `text-[15px] md:text-sm`, meta `text-[13px] md:text-xs`, page title `text-[22px] md:text-xl`, card title `text-[15px] md:text-sm`. Phone breakpoint is `md`, the sidebar shows from `lg`.
