"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  FaUserPlus,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());
  const validatePhone = (phone: string) =>
    /^[0-9+\-() ]{7,15}$/.test(phone.trim());

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: "" }));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    let error = "";
    if (!value.trim()) {
      error = "This field is required.";
    } else if (name === "email" && !validateEmail(value)) {
      error = "Please enter a valid email.";
    } else if (name === "phone" && !validatePhone(value)) {
      error = "Please enter a valid phone number.";
    } else if (name === "confirmPassword" && value !== form.password) {
      error = "Passwords do not match.";
    }
    setErrors((e) => ({ ...e, [name]: error }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // run blur validation on all fields
    ["name", "email", "phone", "password", "confirmPassword"].forEach(
      (field) => {
        handleBlur({
          target: { name: field, value: (form as any)[field] },
        } as any);
      }
    );
    // abort if any errors
    if (Object.values(errors).some((msg) => msg)) return;

    setLoading(true);
    // 1) Create the user
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setErrors((e) => ({ ...e, form: data.error || "Signup failed." }));
      setLoading(false);
      return;
    }

    // 2) Auto-login via NextAuth
    const signInResult = await signIn("credentials", {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (signInResult?.ok) {
      router.push("/dashboard");
    } else {
      setErrors((e) => ({
        ...e,
        form: "Signup succeeded, but auto-login failed. Please log in manually.",
      }));
    }
  }

  return (
    <main className="min-h-screen bg-[#FDF9F4] flex items-center justify-center px-4 py-16">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-lg space-y-6 bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition"
      >
        <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold text-[#2D3E50]">
          <FaUserPlus /> Sign Up
        </h1>
        {errors.form && (
          <p className="text-red-500 text-sm text-center">{errors.form}</p>
        )}

        {/* Row 1: Name & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            icon={<FaUserPlus />}
            label="Name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.name}
          />
          <InputField
            icon={<FaEnvelope />}
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
          />
        </div>

        {/* Row 2: Phone */}
        <InputField
          icon={<FaPhoneAlt />}
          label="Phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.phone}
        />

        {/* Row 3: Password & Confirm Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <InputField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-10 text-[#2D3E50]/60 hover:text-[#2D3E50] transition"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <div className="relative">
            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-10 text-[#2D3E50]/60 hover:text-[#2D3E50] transition"
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#2D3E50] text-white font-semibold py-3 transition hover:bg-[#24466d] active:scale-95 disabled:opacity-50"
        >
          {loading ? "Processing…" : "Create Account"}
        </button>
      </form>
    </main>
  );
}

// Reusable InputField component
function InputField({
  icon,
  label,
  name,
  type,
  value,
  onChange,
  onBlur,
  error,
}: {
  icon?: React.ReactNode;
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="flex items-center gap-2 text-sm font-medium text-[#2D3E50]"
      >
        {icon}
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full rounded-lg border px-4 py-2 text-[#2D3E50] focus:outline-none focus:ring-2 transition ${
          error
            ? "border-red-500 focus:ring-red-300"
            : "border-[#C9D2E0] focus:ring-[#2D3E50]/40"
        }`}
        required
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
