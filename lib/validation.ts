// FormErrors must cover every field in AttendanceFormData so
// keyof AttendanceFormData indexes it without implicit-any errors.
export interface FormErrors {
  full_name?:   string;
  email?:       string;
  phone?:       string;
  institution?: string;   // ← was missing
  designation?: string;   // ← was missing
}

export function validateAttendanceForm(data: {
  full_name:   string;
  email:       string;
  phone:       string;
  institution?: string;
  designation?: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!data.full_name.trim()) {
    errors.full_name = "Full name is required.";
  } else if (data.full_name.trim().length > 32) {
    errors.full_name = "Full name must be 32 characters or less.";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else {
    const emailRegex =
      /^[^\s@]+@([^\s@]+\.(gov\.sl|ac\.sl|com|net|org|edu|gov))$/i;
    if (!emailRegex.test(data.email.trim())) {
      errors.email =
        "Enter a valid email (e.g. name@gmail.com or name@moe.gov.sl).";
    }
  }

  if (data.phone.trim()) {
    const cleaned = data.phone.replace(/[\s\-\(\)\+]/g, "");
    if (!/^\d+$/.test(cleaned)) {
      errors.phone = "Phone must contain only digits.";
    } else if (cleaned.length > 15) {
      errors.phone = "Phone number must not exceed 15 digits.";
    }
  } else {
    errors.phone = "Phone is required.";
  }

  return errors;
}