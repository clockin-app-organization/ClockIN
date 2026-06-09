# ── Smart Attendance – scaffold script
# Run from your project root: .\scaffold.ps1

$dirs = @(
  "app\(auth)\login",
  "app\(auth)\onboarding",
  "app\(admin)\dashboard",
  "app\(admin)\events\new",
  "app\(admin)\events\[eventId]\edit",
  "app\(admin)\events\[eventId]\revive",
  "app\(admin)\events\[eventId]\sessions\new",
  "app\(admin)\events\[eventId]\sessions\[sessionId]\edit",
  "app\(admin)\events\[eventId]\sessions\[sessionId]\revive",
  "app\(admin)\archive",
  "app\(admin)\users\new",
  "app\attend\[token]",
  "app\api\attendance",
  "app\api\token\validate",
  "app\api\push",
  "components\attendance",
  "components\events",
  "components\qr",
  "components\ui",
  "components\layout",
  "lib\supabase",
  "hooks",
  "supabase\functions\auto-manage-events",
  "supabase\functions\midnight-archive",
  "supabase\functions\create-admin",
  "supabase\functions\send-event-notifications",
  "supabase\migrations",
  "public\icons"
)

foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
}

$files = @(
  # App
  "app\(auth)\login\page.tsx",
  "app\(auth)\onboarding\page.tsx",
  "app\(admin)\dashboard\page.tsx",
  "app\(admin)\events\page.tsx",
  "app\(admin)\events\new\page.tsx",
  "app\(admin)\events\[eventId]\page.tsx",
  "app\(admin)\events\[eventId]\edit\page.tsx",
  "app\(admin)\events\[eventId]\revive\page.tsx",
  "app\(admin)\events\[eventId]\sessions\new\page.tsx",
  "app\(admin)\events\[eventId]\sessions\[sessionId]\page.tsx",
  "app\(admin)\events\[eventId]\sessions\[sessionId]\edit\page.tsx",
  "app\(admin)\events\[eventId]\sessions\[sessionId]\revive\page.tsx",
  "app\(admin)\archive\page.tsx",
  "app\(admin)\users\page.tsx",
  "app\(admin)\users\new\page.tsx",
  "app\attend\[token]\page.tsx",
  "app\layout.tsx",
  "app\page.tsx",
  "app\globals.css",
  # API routes
  "app\api\attendance\route.ts",
  "app\api\token\validate\route.ts",
  "app\api\push\route.ts",
  # Components – attendance
  "components\attendance\AttendanceForm.tsx",
  "components\attendance\HeatMap.tsx",
  "components\attendance\LocationCapture.tsx",
  # Components – events
  "components\events\EventCard.tsx",
  "components\events\EventForm.tsx",
  "components\events\SessionCard.tsx",
  "components\events\SessionForm.tsx",
  "components\events\RevivalForm.tsx",
  # Components – qr
  "components\qr\QRDisplay.tsx",
  # Components – ui
  "components\ui\Badge.tsx",
  "components\ui\StatusBadge.tsx",
  "components\ui\Modal.tsx",
  "components\ui\Navbar.tsx",
  # Components – layout
  "components\layout\Sidebar.tsx",
  "components\layout\AdminShell.tsx",
  "components\layout\PublicShell.tsx",
  # Lib
  "lib\supabase\client.ts",
  "lib\supabase\server.ts",
  "lib\auth.ts",
  "lib\device.ts",
  "lib\validation.ts",
  "lib\types.ts",
  "lib\utils.ts",
  # Hooks
  "hooks\useUser.ts",
  "hooks\useEvent.ts",
  "hooks\useAttendees.ts",
  # Root config
  "middleware.ts",
  ".env.local"
)

foreach ($f in $files) {
  if (-not (Test-Path $f)) {
    New-Item -ItemType File -Force -Path $f | Out-Null
  }
}

Write-Host ""
Write-Host "Done. Scaffold created." -ForegroundColor Green
Write-Host ""
Write-Host "PASTE YOUR EXISTING FILES HERE:" -ForegroundColor Cyan
Write-Host "  app\page.tsx               <- your Home redirect"
Write-Host "  app\globals.css            <- your Tailwind CSS"
Write-Host "  lib\supabase\client.ts     <- your createClient()"
Write-Host "  lib\utils.ts               <- your utils (cn, token, cluster...)"
Write-Host "  components\layout\Sidebar.tsx  <- your Sidebar component"
Write-Host ""
Write-Host "PASTE YOUR SCHEMA:" -ForegroundColor Cyan
Write-Host "  supabase\migrations\001_schema.sql"
Write-Host ""