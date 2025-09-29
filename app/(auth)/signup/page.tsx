// app/signup/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  FaUserPlus,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaPhoneAlt,
  FaCheckCircle,
  FaSignInAlt,
  FaGoogle,
  FaApple,
} from "react-icons/fa";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ---------- helpers ---------- */
  const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());

  /* ---------- effects ---------- */
  useEffect(() => {
    if (success) {
      router.push("/app/onboarding");
    }
  }, [success, router]);

  /* ---------- handlers ---------- */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  }

  const handleSocialLogin = async (provider: "google" | "apple") => {
    try {
      await signIn(provider, { callbackUrl: "/app/onboarding" });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: `Failed to sign in with ${provider}`,
      }));
    }
  };

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    let error = "";

    /* text fields */
    if (!value.trim()) error = "This field is required.";
    else if (name === "email" && !validateEmail(value))
      error = "Please enter a valid email.";
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

    ["email", "password", "confirmPassword"].forEach((field) => {
      const value = (form as any)[field];
      let error = "";

      // Validate each field
      if (typeof value === "string" && !value.trim()) {
        error = "This field is required.";
      } else if (field === "email" && !validateEmail(value)) {
        error = "Please enter a valid email.";
      } else if (field === "confirmPassword" && value !== form.password) {
        error = "Passwords do not match.";
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

      // Auto-login the user after successful signup
      const signInResult = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        setSuccess(true);
      } else {
        setErrors((prev) => ({
          ...prev,
          form: "Account created but login failed. Please try logging in manually.",
        }));
      }
    } catch (error) {
      console.error("Signup error:", error);
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

      {/* form view */}
      <main className="min-h-screen bg-[#FDF9F4] flex justify-center items-center p-6">
        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow space-y-6">
          <h2 className="text-3xl font-extrabold text-[#2D3E50] text-center flex items-center justify-center gap-2">
            <FaUserPlus /> Create Account
          </h2>
          {errors.form && (
            <p className="text-red-500 text-center">{errors.form}</p>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSocialLogin("google")}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold transition hover:bg-gray-50 hover:border-gray-400"
            >
              <FaGoogle className="text-red-500" size={20} />
              Continue with Google
            </button>

            <button
              onClick={() => handleSocialLogin("apple")}
              className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 px-4 rounded-lg font-semibold transition hover:bg-gray-800"
            >
              <FaApple size={20} />
              Continue with Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or create account with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* email */}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2D3E50] text-white rounded-lg disabled:opacity-50"
            >
              {loading ? "Processing…" : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-[#2D3E50] font-semibold hover:underline"
              >
                Log in
              </a>
            </p>
          </div>
        </div>
      </main>
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
