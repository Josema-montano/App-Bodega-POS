# AI Development Guide for App-Bodega-POS

## Project Overview
This is a Point-of-Sale (POS) system built with React + TypeScript + Vite, using Supabase as the backend. The application manages inventory, sales, customers, suppliers, and finances for a small business.

## Architecture Patterns

### State Management (Zustand + Services)
- **Global State**: Uses Zustand stores in `src/store/index.ts` (761 lines) with persistence middleware
- **Service Layer**: Each domain has a dedicated service (`src/services/`) that handles Supabase operations
- **Auth Flow**: `useSupabaseAuth()` hook manages session persistence, `useSupabaseInit()` loads initial data
- **Error Handling**: Services use `handleSupabaseError()` from `src/lib/supabase.ts` for consistent error management

### Key Data Flow
1. Authentication via Supabase Auth → Store user in `useAuthStore`
2. `useSupabaseInit()` hook triggers data loading for authenticated users
3. Services fetch from Supabase → Update Zustand stores → Components react to state changes
4. Real-time updates via Supabase subscriptions (see `useNotifications` hook)

### Component Architecture
- **Layout**: `Layout` → `Header` + `Sidebar` structure in `src/components/layout/`
- **Route Protection**: `ProtectedRoute` and `PublicRoute` wrappers in `App.tsx`
- **UI Components**: Reusable components in `src/components/ui/` (Button, Card, Table, etc.)
- **Page Components**: Each route corresponds to a page in `src/pages/`

## Development Workflow

### Environment Setup
1. Copy `.env.example` to `.env` and configure Supabase credentials
2. Run `npm run dev` for development server
3. Use `npm run check` for TypeScript checking without build
4. Database setup via `SUPABASE_SETUP.md` (329 lines of SQL schemas)

### Key Scripts
- `npm run dev` - Vite dev server with HMR
- `npm run build` - TypeScript compilation + Vite build
- `npm run check` - TypeScript type checking only
- `npm run lint` - ESLint with TypeScript-aware rules

### Testing Database Connection
- Use `test-supabase.js` for connection verification
- Services include error handling via `handleSupabaseError()`
- Connection check in `useSupabaseInit` hook logs status to console

## Project-Specific Conventions

### File Organization
- **Types**: Centralized in `src/types/index.ts` (268 lines) - always import from here
- **Services**: One service per domain (product, customer, supplier, etc.)
- **Hooks**: Custom hooks for Supabase integration, notifications, theme
- **Database**: Supabase schemas and migrations in `supabase/` directory

### Naming Patterns
- **Database Fields**: Snake_case (e.g., `is_active`, `created_at`)
- **TypeScript Types**: PascalCase interfaces (e.g., `User`, `Product`)
- **Service Methods**: Descriptive names (`getAllWithInventory()`, `updateStock()`)

### State Updates
- Services handle Supabase operations AND update Zustand stores
- Use `toast` from 'sonner' for user feedback (configured in `App.tsx`)
- Real-time subscriptions in hooks (see `useNotifications` pattern)

### Authentication Flow
```tsx
// Always check authentication status in protected operations
const { user, isAuthenticated } = useAuthStore();
if (!isAuthenticated) return;
```

## Integration Points

### Supabase Integration
- **Client**: Configured in `src/lib/supabase.ts` with environment variables
- **Auth**: Session management via `useSupabaseAuth()` hook
- **Real-time**: Subscription patterns in `useNotifications` and similar hooks
- **Types**: Database types defined in `src/lib/supabase.ts` (lines 14-226)

### Key External Dependencies
- **UI**: Tailwind CSS + Lucide React icons + custom components
- **Forms**: React Hook Form + Zod validation (see form patterns in pages)
- **Routing**: React Router v7 with nested route protection
- **Notifications**: Sonner toast library integrated in `App.tsx`
- **Charts**: Recharts for financial dashboards

### Special Build Configuration
- **Vite Plugin**: `vite-plugin-trae-solo-badge` adds branding (configurable in `vite.config.ts`)
- **Dev Tools**: React dev locator enabled for debugging
- **TypeScript**: Strict configuration with path mapping via `vite-tsconfig-paths`

## Common Patterns to Follow

1. **Service Creation**: Always include CRUD operations + Zustand store updates
2. **Component Props**: Use TypeScript interfaces, prefer composition over large prop objects
3. **Error Handling**: Wrap Supabase calls in try-catch using `handleSupabaseError()`
4. **Loading States**: Use local state for UI loading, global state for data
5. **Form Validation**: React Hook Form + Zod schema validation pattern (see existing forms)

When adding new features, follow the established service → store → component pattern and ensure proper TypeScript typing throughout the data flow.
