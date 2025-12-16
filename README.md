## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing (no React Router dependency)
- Single-page application (SPA) architecture

**UI Component System:**
- Shadcn UI component library based on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Material Design principles adapted for military-professional aesthetics
- Inter font family via Google Fonts CDN
- Custom CSS variables for theming (light mode focused)

**State Management:**
- TanStack Query (React Query) for server state management and caching
- Local React state for UI-specific state
- No global state management library (Redux/Zustand) - queries handle shared state

**Form Handling:**
- React Hook Form for form state management
- Zod for schema validation
- @hookform/resolvers for integrating Zod with React Hook Form

### Backend Architecture

**Server Framework:**
- Express.js running on Node.js
- TypeScript for type safety across the stack
- ESM (ES Modules) instead of CommonJS

**Database & ORM:**
- PostgreSQL database 
- Drizzle ORM for type-safe database queries

**Authentication & Security:**
- JWT (JSON Web Tokens) for stateless authentication
- Bcrypt for password hashing
- Bearer token authentication for protected routes
- Two separate auth systems: admin login and PIC verification

**API Design:**
- RESTful API architecture
- JSON request/response format
- Middleware for token verification on protected routes
- Request logging with timing information

**Database Schema:**
The application uses five main tables with the following relationships:
- **barracks**: Core facility data with optional PIC assignment and verification status
- **pics**: Person in Charge credentials and information
- **admins**: Administrator credentials
- **inventory**: Items tracked per barrack (cascade delete on barrack removal)
- **members**: Personnel assigned to barracks (cascade delete on barrack removal)

All tables use auto-incrementing integer primary keys. The barracks table has an optional foreign key to pics, while inventory and members have required foreign keys to barracks with cascade deletion.

### Routing Structure

**Public Routes:**
- `/` - Home page with barracks directory and search
- `/barrack/:id` - Individual barrack detail page with inventory/members
- `/admin/login` - Admin authentication page

**Protected Admin Routes (require JWT):**
- `/admin/dashboard` - Overview statistics and quick actions
- `/admin/barracks` - Barracks management with CRUD operations
- `/admin/barracks/new` - Create new barrack
- `/admin/barracks/:id/edit` - Edit existing barrack
- `/admin/inventory` - Global inventory management
- `/admin/members` - Global personnel management

### Key Architectural Decisions

**Monorepo Structure:**
The codebase uses a shared folder approach with three main directories:
- `client/` - Frontend React application
- `server/` - Backend Express application  
- `shared/` - Shared TypeScript types and Zod schemas

This allows type sharing between frontend and backend while maintaining separation of concerns.

**Build & Deployment:**
- Development: Vite dev server proxies API requests to Express
- Production: Vite builds static assets, Express serves them alongside API
- Single deployment artifact with both frontend and backend

**Authentication Flow:**
- Admin login generates JWT stored in localStorage
- Protected routes check for token on component mount, redirect if missing
- API requests include token in Authorization header
- Server middleware verifies token before processing protected requests

**Data Fetching Strategy:**
- TanStack Query handles all server data fetching and caching
- Optimistic updates on mutations with automatic cache invalidation
- Loading and error states managed declaratively
- No manual fetch() calls in components (abstracted via queryClient)

**Verification System:**
- Barracks have a boolean `verified` field
- PICs can verify their assigned barrack via username/password
- Separate from admin authentication system
- Verification status displayed with badges in UI

## External Dependencies

**Database:**
- Neon Serverless PostgreSQL (requires DATABASE_URL environment variable)
- Connection pooling via @neondatabase/serverless
- WebSocket support for serverless connections

**UI Component Libraries:**
- Radix UI primitives (20+ packages) for accessible, unstyled components
- Lucide React for iconography
- class-variance-authority for component variant management
- tailwind-merge and clsx for className utilities

**Authentication & Security:**
- jsonwebtoken for JWT creation/verification
- bcryptjs for password hashing
- Zod for runtime validation and schema generation

**Build & Tooling:**
- esbuild for server-side bundling in production
- tsx for TypeScript execution in development
- drizzle-kit for database migrations

**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `SESSION_SECRET` - JWT signing secret (defaults to insecure value in development)
- `NODE_ENV` - Environment indicator (development/production)

**Asset Management:**
- Static barrack images stored in `attached_assets/generated_images/`
- Four pre-generated military barrack photos available as predefined options
- Images referenced via Vite's asset import system
- **Local Photo Storage:**
  - Custom uploaded photos stored in `/uploads` folder on the server
  - `localFileStorage.ts` handles file operations (save, serve, delete)
  - `BarrackPhotoUpload` component for device file uploads
  - Direct multipart upload via `POST /api/barracks/photo-upload` (admin-protected)
  - Photos served via `GET /uploads/:filename` endpoint
  - Automatic cleanup: old photos deleted when replaced or when barracks are deleted
  - Works locally and on VPS hosting without cloud dependencies