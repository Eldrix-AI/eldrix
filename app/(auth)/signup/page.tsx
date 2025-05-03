// app/signup/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaUserPlus,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaPhoneAlt,
  FaCheckCircle,
  FaSignInAlt,
} from "react-icons/fa";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    smsConsent: false,
    emailList: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  /* ---------- helpers ---------- */
  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());
  const validatePhone = (phone: string) =>
    /^[0-9+\-() ]{7,15}$/.test(phone.trim());

  /* ---------- effects ---------- */
  useEffect(() => {
    if (success && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (success && countdown === 0) router.push("/login");
  }, [success, countdown, router]);

  /* ---------- handlers ---------- */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, type, value, checked } = e.target;
    let error = "";

    /* checkbox fields */
    if (type === "checkbox") {
      if (name === "smsConsent" && !checked)
        error = "You must agree to receive SMS & calls.";
      setErrors((er) => ({ ...er, [name]: error }));
      return;
    }

    /* text fields */
    if (!value.trim()) error = "This field is required.";
    else if (name === "email" && !validateEmail(value))
      error = "Please enter a valid email.";
    else if (name === "phone" && !validatePhone(value))
      error = "Please enter a valid phone number.";
    else if (name === "confirmPassword" && value !== form.password)
      error = "Passwords do not match.";

    setErrors((er) => ({ ...er, [name]: error }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Clear any previous form-level error
    setErrors((prev) => ({ ...prev, form: "" }));

    /* trigger blur validation on every field */
    const newErrors: Record<string, string> = {};

    [
      "name",
      "email",
      "phone",
      "password",
      "confirmPassword",
      "smsConsent",
      "emailList",
    ].forEach((field) => {
      const value = (form as any)[field];
      let error = "";

      // Validate each field
      if (field !== "emailList") {
        if (field === "smsConsent" && !value) {
          error = "You must agree to receive SMS & calls.";
        } else if (typeof value === "string" && !value.trim()) {
          error = "This field is required.";
        } else if (field === "email" && !validateEmail(value)) {
          error = "Please enter a valid email.";
        } else if (field === "phone" && !validatePhone(value)) {
          error = "Please enter a valid phone number.";
        } else if (field === "confirmPassword" && value !== form.password) {
          error = "Passwords do not match.";
        }
      }

      if (error) {
        newErrors[field] = error;
      }
    });

    // Update errors state with new validation results
    setErrors(newErrors);

    // Check if there are any validation errors
    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setErrors((prev) => ({ ...prev, form: error || "Signup failed." }));
        return;
      }

      setSuccess(true);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: "Network error. Please try again.",
      }));
    } finally {
      setLoading(false);
    }
  }

  /* ---------- JSX ---------- */
  return (
    <>
      {/* header */}
      <header className="bg-[#2D3E50] p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold">Eldrix</h1>
          <a href="/login" className="text-white underline">
            Login
          </a>
        </div>
      </header>

      {/* success view */}
      {success ? (
        <main className="min-h-screen bg-[#FDF9F4] flex justify-center items-center p-6">
          <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow text-center space-y-6">
            <FaCheckCircle className="mx-auto text-6xl text-green-500" />
            <h2 className="text-3xl font-extrabold text-[#2D3E50]">
              Account Created!
            </h2>
            <p className="text-gray-600">
              Redirecting to login in {countdown}s…
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-3 bg-[#2D3E50] text-white rounded-lg flex items-center justify-center gap-2"
            >
              <FaSignInAlt /> Login Now
            </button>
          </div>
        </main>
      ) : (
        /* form view */
        <main className="min-h-screen bg-[#FDF9F4] flex justify-center items-center p-6">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="w-full max-w-lg bg-white p-8 rounded-2xl shadow space-y-6"
          >
            <h2 className="text-3xl font-extrabold text-[#2D3E50] text-center flex items-center justify-center gap-2">
              <FaUserPlus /> Create Account
            </h2>
            {errors.form && (
              <p className="text-red-500 text-center">{errors.form}</p>
            )}

            {/* name / email */}
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

            {/* phone */}
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

            {/* passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PasswordField
                label="Password"
                name="password"
                value={form.password}
                show={showPassword}
                setShow={setShowPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
              />
              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                value={form.confirmPassword}
                show={showConfirm}
                setShow={setShowConfirm}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.confirmPassword}
              />
            </div>

            {/* email opt‑in */}
            <Checkbox
              id="emailList"
              name="emailList"
              checked={form.emailList}
              onChange={handleChange}
              label="Subscribe to email updates"
            />

            {/* sms consent (required) */}
            <Checkbox
              id="smsConsent"
              name="smsConsent"
              checked={form.smsConsent}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              label="I agree to receive SMS & calls from Eldrix for support"
              error={errors.smsConsent}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2D3E50] text-white rounded-lg disabled:opacity-50"
            >
              {loading ? "Processing…" : "Create Account"}
            </button>
          </form>
        </main>
      )}
    </>
  );
}

/* ---------- sub‑components ---------- */
function InputField({
  icon,
  label,
  name,
  type,
  value,
  onChange,
  onBlur,
  error,
}: any) {
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
        required
        className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 transition ${
          error
            ? "border-red-500 focus:ring-red-300"
            : "border-[#C9D2E0] focus:ring-[#2D3E50]/40"
        }`}
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  show,
  setShow,
  onChange,
  onBlur,
  error,
}: any) {
  return (
    <div className="relative">
      <InputField
        label={label}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        error={error}
      />
      <button
        type="button"
        onClick={() => setShow((v: boolean) => !v)}
        className="absolute right-3 top-9 text-[#2D3E50]/60"
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}

function Checkbox({
  id,
  name,
  checked,
  onChange,
  onBlur,
  label,
  required,
  error,
}: any) {
  return (
    <>
      <div className="flex items-center">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
        />
        <label htmlFor={id} className="ml-2 text-sm text-gray-700">
          {label}
        </label>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </>
  );
}
