// lib/validation.ts

// ── Attendance Form ──────────────────────────────────────────────────────────

export interface FormErrors {
  full_name?:   string;
  email?:       string;
  phone?:       string;
  institution?: string;
  designation?: string;
}

export function validateAttendanceForm(data: {
  full_name:    string;
  email:        string;
  phone:        string;
  institution?: string;
  designation?: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!data.full_name.trim()) {
    errors.full_name = 'Full name is required.';
  } else if (data.full_name.trim().length > 32) {
    errors.full_name = 'Full name must be 32 characters or less.';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required.';
  } else {
    const emailRegex = /^[^\s@]+@([^\s@]+\.(gov\.sl|ac\.sl|com|net|org|edu|gov))$/i;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Enter a valid email (e.g. name@gmail.com or name@moe.gov.sl).';
    }
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone is required.';
  } else {
    const cleaned = data.phone.replace(/[\s\-\(\)\+]/g, '');
    if (!/^\d+$/.test(cleaned)) {
      errors.phone = 'Phone must contain only digits.';
    } else if (cleaned.length > 15) {
      errors.phone = 'Phone number must not exceed 15 digits.';
    }
  }

  return errors;
}

// ── Event Form ───────────────────────────────────────────────────────────────

export interface EventFormErrors {
  name?:       string;
  location?:   string;
  event_date?: string;
  start_time?: string;
  end_time?:   string;
}

/** Returns today as YYYY-MM-DD in local time */
function localToday(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export function validateEventForm(data: {
  name:       string;
  location:   string;
  event_date: string;  // 'YYYY-MM-DD'
  start_time: string;  // 'HH:MM'
  end_time:   string;  // 'HH:MM'
}): EventFormErrors {
  const errors: EventFormErrors = {};
  const now   = new Date();
  const today = localToday();

  // ── Name & location ───────────────────────────────────────────────────────
  if (!data.name.trim())     errors.name     = 'Event name is required.';
  if (!data.location.trim()) errors.location = 'Location is required.';

  // ── Date ──────────────────────────────────────────────────────────────────
  if (!data.event_date) {
    errors.event_date = 'Event date is required.';
  } else if (data.event_date < today) {
    errors.event_date = 'Event date cannot be in the past.';
  }

  // ── Start time ────────────────────────────────────────────────────────────
  if (!data.start_time) {
    errors.start_time = 'Start time is required.';
  } else if (data.event_date && !errors.event_date) {
    // Parse as local time — no 'Z' suffix so JS treats it as local
    const startDt = new Date(`${data.event_date}T${data.start_time}:00`);
    if (startDt <= now) {
      errors.start_time = 'Start date & time must be in the future.';
    }
  }

  // ── End time ──────────────────────────────────────────────────────────────
  if (!data.end_time) {
    errors.end_time = 'End time is required.';
  } else if (data.start_time) {
    const [sh, sm] = data.start_time.split(':').map(Number);
    const [eh, em] = data.end_time.split(':').map(Number);
    const diffMins = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMins < 5) {
      errors.end_time = 'End time must be at least 5 minutes after start time.';
    }
  }

  return errors;
}