
# ClockIN - Smart Attendance Management System

A modern, real-time attendance management platform built with Next.js and Supabase. Generate QR codes, track check-ins with GPS coordinates, manage events and sessions, and generate comprehensive attendance analytics—all from a centralized admin dashboard.

## Features

- **QR Code Attendance**: Generate dynamic QR codes for quick and accurate check-ins
- **Event Management**: Create, schedule, and manage events with multiple sessions and custom configurations
- **Real-Time Session Control**: Start, monitor, and end sessions with live status updates
- **Location-Based Tracking**: Capture GPS coordinates during check-in for location verification
- **Admin Dashboard**: Monitor events, track attendance metrics, and view real-time analytics
- **Attendance Analytics**: Heatmaps, attendance reports, and detailed session statistics
- **User Management**: Role-based access control (Admin/User) and comprehensive user administration
- **Archive System**: Archive or revive events and sessions for historical record-keeping
- **Responsive Design**: Fully responsive admin interface and mobile-friendly check-in pages

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with PostCSS
- **Database**: Supabase (PostgreSQL-backed)
- **Authentication**: Supabase SSR
- **QR Code Generation**: qrcode.react
- **Maps & Location**: Leaflet, React Leaflet, Google Maps API
- **UI Components**: Lucide React icons
- **Date Utilities**: date-fns
- **Linting**: ESLint 9 with Next.js config

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn** package manager
- A **Supabase** project (free tier available at [supabase.com](https://supabase.com))
- **Google Maps API key** (for location features, optional)
- Modern web browser with location services support

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ClockIN
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Navigate to **Project Settings** > **API**
3. Copy your **Project URL** and add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   ```
4. Copy your **anon (public) key** and add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
5. Open the **SQL Editor** in Supabase and run the migrations from:
   - `supabase/migrations/001_schema.sql` - Creates core tables (events, sessions, attendance, users)
   - `supabase/migrations/002_rls_and_cron.sql` - Sets up Row Level Security and scheduled tasks

These migrations create:
- `events`: Event profiles, status, and metadata
- `sessions`: Session management, QR codes, and timestamps
- `attendance`: Check-in records with coordinates and tokens
- `profiles`: User data and roles
- Supabase Storage bucket for document uploads

### 3. Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Google Maps (Optional, for location features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App Configuration (Optional)
NEXT_PUBLIC_APP_NAME=ClockIN
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Running the Application

**Development Mode:**

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

**Production Build:**

```bash
npm run build
npm start
```

**Linting:**

```bash
npm run lint
```

## Project Structure

```
ClockIN/
├── app/
│   ├── globals.css                 # Global Tailwind styles
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page
│   ├── (admin)/                    # Admin routes (authenticated)
│   │   ├── layout.tsx              # Admin layout with sidebar
│   │   ├── dashboard/              # Admin dashboard overview
│   │   ├── events/                 # Event management
│   │   │   ├── page.tsx            # Events list
│   │   │   ├── new/                # Create new event
│   │   │   ├── [eventId]/
│   │   │   │   ├── page.tsx        # Event detail
│   │   │   │   ├── edit/           # Edit event
│   │   │   │   ├── revive/         # Restore archived event
│   │   │   │   └── sessions/       # Session management
│   │   │   │       ├── [sessionId]/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   ├── edit/
│   │   │   │       │   └── revive/
│   │   │   │       └── new/        # Create new session
│   │   ├── sessions/               # All sessions across events
│   │   ├── users/                  # User management
│   │   │   ├── page.tsx            # Users list
│   │   │   ├── new/                # Create new user
│   │   │   └── [id]/               # User detail and edit
│   │   ├── archive/                # View archived records
│   │   └── profile/                # Admin profile settings
│   ├── (auth)/                     # Authentication routes
│   │   ├── login/                  # User login page
│   │   └── onboarding/             # New user setup
│   ├── attend/
│   │   └── [token]/                # Public QR check-in page
│   └── api/
│       ├── attendance/             # POST - Record check-in
│       ├── push/                   # POST - Push notifications
│       ├── token/
│       │   └── validate/           # GET - Validate tokens
├── components/
│   ├── admin/                      # Admin-specific components
│   │   └── TopBar.tsx              # Admin top navigation
│   ├── attendance/                 # Attendance features
│   │   ├── AttendeeTable.tsx       # Display attendees
│   │   ├── HeatMap.tsx             # Attendance heatmap
│   │   └── ManualAttendanceUpload.tsx # CSV upload
│   ├── events/                     # Event management components
│   │   ├── EventForm.tsx           # Event creation/editing
│   │   ├── SessionForm.tsx         # Session creation/editing
│   │   ├── EventStatusWatcher.tsx  # Real-time status updates
│   │   ├── LocationPicker.tsx      # Location selection
│   │   ├── StartSessionButton.tsx  # Session controls
│   │   ├── EndSessionButton.tsx
│   │   ├── DeleteEventButton.tsx
│   │   └── DownloadAttendeesButton.tsx
│   ├── layout/
│   │   ├── AdminShell.tsx          # Admin layout wrapper
│   │   ├── PublicShell.tsx         # Public layout wrapper
│   │   └── Sidebar.tsx             # Navigation sidebar
│   ├── qr/
│   │   └── QRDisplay.tsx           # QR code display component
│   └── ui/
│       └── Modal.tsx               # Reusable modal component
├── lib/
│   ├── auth.ts                     # Authentication utilities
│   ├── device.ts                   # Device/browser utilities
│   ├── types.ts                    # TypeScript types and interfaces
│   ├── utils.ts                    # General utility functions
│   ├── validation.ts               # Form validation helpers
│   └── supabase/
│       ├── client.ts               # Supabase client (browser)
│       └── server.ts               # Supabase client (server)
├── public/
│   ├── manifest.json               # PWA manifest
│   └── icons/                      # App icons
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql          # Database schema
│       └── 002_rls_and_cron.sql    # Security and automation
├── eslint.config.mjs               # ESLint configuration
├── tsconfig.json                   # TypeScript configuration
├── next.config.ts                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.mjs              # PostCSS configuration
└── middleware.ts                   # Next.js middleware (auth checks)
```

## Key Pages & Routes

### Admin Routes (`/admin/*`)

| Route | Purpose |
|-------|---------|
| `/admin/dashboard` | Overview dashboard with key metrics |
| `/admin/events` | Manage all events |
| `/admin/events/new` | Create new event |
| `/admin/events/[eventId]` | Event details and configuration |
| `/admin/events/[eventId]/edit` | Edit event settings |
| `/admin/events/[eventId]/sessions` | Manage event sessions |
| `/admin/events/[eventId]/sessions/[sessionId]` | Session details |
| `/admin/events/[eventId]/sessions/new` | Create new session |
| `/admin/sessions` | View all sessions across events |
| `/admin/users` | Manage system users |
| `/admin/users/new` | Create new user |
| `/admin/users/[id]` | User details and edit |
| `/admin/archive` | View archived events and sessions |
| `/admin/profile` | Admin profile settings |

### Public Routes

| Route | Purpose |
|-------|---------|
| `/login` | User login page |
| `/onboarding` | New user registration and setup |
| `/attend/[token]` | QR code check-in page (public, no auth required) |

## API Endpoints

### Attendance

**POST** `/api/attendance`

Record a new check-in. Requires valid session token and optionally GPS coordinates.

Request body:
```json
{
  "token": "session-token-uuid",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "userId": "user-uuid"
}
```

Response:
```json
{
  "id": "attendance-uuid",
  "sessionId": "session-uuid",
  "userId": "user-uuid",
  "timestamp": "2026-06-23T10:30:00Z",
  "coordinates": { "lat": 40.7128, "lng": -74.0060 }
}
```

### Push Notifications

**POST** `/api/push`

Handle push notification subscriptions and delivery.

### Token Validation

**GET** `/api/token/validate?token=<token>`

Validate a session token and return session details.

Response:
```json
{
  "valid": true,
  "sessionId": "session-uuid",
  "eventId": "event-uuid",
  "sessionName": "Session Name",
  "isActive": true
}
```

## User Roles

- **Admin**: Full access to create, configure, and manage events, sessions, users, and view all analytics
- **User**: Can check in to events via QR code and view personal attendance history

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Create a new project on [Vercel](https://vercel.com)
3. Connect your GitHub repository
4. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional)
5. Deploy

### Self-Hosted

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Use a reverse proxy (nginx) and process manager (PM2) for production stability

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please ensure your code follows the ESLint configuration and TypeScript strict mode.

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

**macOS/Linux:**
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
kill -9 <PID>
```

**Windows PowerShell:**
```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object LocalAddress, LocalPort, OwningProcess
Stop-Process -Id <PID>
```

### Supabase Connection Issues

- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that migrations have been run in Supabase SQL Editor
- Ensure Supabase project is not paused

### QR Code Not Scanning

- Verify session is active
- Check that QR code token hasn't expired
- Test with multiple devices/QR scanners

## License

[Add your license here]

## Support

For issues, questions, or feature requests, please:

1. Check existing GitHub issues
2. Create a new issue with detailed reproduction steps
3. Contact the development team

---

**Last Updated**: June 2026
**Version**: 0.1.0
```

Then open [http://localhost:3000](http://localhost:3000)

