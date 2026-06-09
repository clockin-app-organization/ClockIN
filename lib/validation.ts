/**
 * All form-level validation rules for ClockIN.
 * - full_name: max 32 chars
 * - email: real TLD (gov.sl, gmail.com, etc.)
 * - phone: max 15 digits (E.164 compatible)
 */

const ALLOWED_EMAIL_DOMAINS = [
  "gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com",
  "gov.sl","edu.sl","nic.sl","ntrc.gov.sl","mof.gov.sl",
  "yahoo.co.uk","live.com","me.com","protonmail.com","zoho.com",
];

export function validateFullName(name: string): string | null {
  if (!name.trim()) return "Full name is required.";
  if (name.trim().length < 2) return "Name is too short.";
  if (name.trim().length > 32) return "Name must be 32 characters or fewer.";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";
  const lower = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(lower)) return "Enter a valid email address.";
  const domain = lower.split("@")[1];
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return `Email domain "${domain}" is not accepted. Use a recognised domain (e.g. gmail.com, gov.sl).`;
  }
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Phone number is required.";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "Phone number is too short.";
  if (digits.length > 15) return "Phone number must not exceed 15 digits.";
  return null;
}

export interface AttendanceErrors {
  full_name?: string;
  email?: string;
  phone?: string;
}

export function validateAttendanceForm(data: {
  full_name: string;
  email: string;
  phone: string;
}): AttendanceErrors {
  const errors: AttendanceErrors = {};
  const nameErr = validateFullName(data.full_name);
  const emailErr = validateEmail(data.email);
  const phoneErr = validatePhone(data.phone);
  if (nameErr) errors.full_name = nameErr;
  if (emailErr) errors.email = emailErr;
  if (phoneErr) errors.phone = phoneErr;
  return errors;
}