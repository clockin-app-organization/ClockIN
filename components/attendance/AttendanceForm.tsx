// components/attendance/AttendanceForm.tsx
"use client";
import { useState } from "react";
import { validateAttendanceForm } from "@/lib/validation";
import { Loader2 } from "lucide-react";

export interface AttendanceFormData {
  full_name: string;
  email: string;
  phone: string;
  institution: string;
  designation: string;
}

interface AttendanceFormProps {
  initial?: Partial<AttendanceFormData>;
  onSubmit: (data: AttendanceFormData) => Promise<void> | void;
  loading?: boolean;
}

export default function AttendanceForm({
  initial = {},
  onSubmit,
  loading = false,
}: AttendanceFormProps) {
  const [form, setForm] = useState<AttendanceFormData>({
    full_name: initial.full_name || "",
    email: initial.email || "",
    phone: initial.phone || "",
    institution: initial.institution || "",
    designation: initial.designation || "",
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateAttendanceForm>>({} as ReturnType<typeof validateAttendanceForm>);

  const handleChange = (field: keyof AttendanceFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAttendanceForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Full Name *</label>
        <input
          type="text"
          placeholder="John Doe"
          value={form.full_name}
          onChange={(e) => handleChange("full_name", e.target.value)}
          className={`input-base ${errors.full_name ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
          maxLength={32}
          required
        />
        {errors.full_name && (
          <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
        )}
      </div>

      <div>
        <label className="label">Email *</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className={`input-base ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
          required
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="label">Phone *</label>
        <input
          type="tel"
          placeholder="+232 76 123456"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className={`input-base ${errors.phone ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
          maxLength={15}
          required
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="label">Institution (optional)</label>
        <input
          type="text"
          placeholder="Ministry of Health"
          value={form.institution}
          onChange={(e) => handleChange("institution", e.target.value)}
          className="input-base"
        />
      </div>

      <div>
        <label className="label">Designation (optional)</label>
        <input
          type="text"
          placeholder="Officer"
          value={form.designation}
          onChange={(e) => handleChange("designation", e.target.value)}
          className="input-base"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Check In
      </button>
    </form>
  );
}