import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signupAPI } from "../../src/services/api";

export default function SignUp() {
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState({});
  const [loading, setLoading] = useState(false);
  let navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupData({
      ...signupData,
      [name]: value,
    });
    setError({ ...error, [name]: null, general: null });
  };

  const handleValidateAndSubmit = async (e) => {
    if (e) e.preventDefault();
    let formError = {};

    if (!signupData.name) {
      formError.name = "Full name is required";
    }
    if (!signupData.email) {
      formError.email = "Email is required";
    }
    if (!signupData.password) {
      formError.password = "Password is required";
    } else if (signupData.password.length < 6) {
      formError.password = "Password must be at least 6 characters";
    }
    if (!signupData.confirmPassword) {
      formError.confirmPassword = "Confirm password is required";
    } else if (signupData.password !== signupData.confirmPassword) {
      formError.wrongpass = "The confirm password does not match";
    }

    if (Object.keys(formError).length > 0) {
      setError(formError);
      return;
    }

    try {
      setLoading(true);
      setError({});
      const res = await signupAPI({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res));
      console.log("Account created:", res);
      navigate("/panel");
    } catch (err) {
      console.error("Signup error:", err);
      setError({ general: err.message || "Signup failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900 text-white">
        <div>
          <h1 className="text-6xl font-black leading-tight">
            Create
            <br />
            Account
          </h1>
          <p className="mt-6 max-w-md text-lg text-emerald-100">
            Join our platform and start managing your stock portfolio, tracking live market graphs, and analyzing holdings securely from one place.
          </p>
          <div className="mt-10 flex gap-4">
            <div className="h-3 w-16 rounded-full bg-white"></div>
            <div className="h-3 w-8 rounded-full bg-white/40"></div>
            <div className="h-3 w-8 rounded-full bg-white/40"></div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">
              Create Account
            </h1>
            <p className="mt-2 text-gray-400">
              Enter your details below to get started
            </p>
          </div>

          {error.general && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
              <span>⚠️</span>
              <span>{error.general}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleValidateAndSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                className="w-full rounded-lg border border-gray-700 bg-slate-900 px-4 py-3 text-white placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                type="text"
                name="name"
                value={signupData.name}
                placeholder="Enter your full name"
                onChange={handleChange}
              />
              {error.name && <p className="mt-1 text-sm text-red-400">{error.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                className="w-full rounded-lg border border-gray-700 bg-slate-900 px-4 py-3 text-white placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                type="email"
                name="email"
                value={signupData.email}
                placeholder="Enter your email"
                onChange={handleChange}
              />
              {error.email && <p className="mt-1 text-sm text-red-400">{error.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Password
              </label>
              <input
                className="w-full rounded-lg border border-gray-700 bg-slate-900 px-4 py-3 text-white placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                type="password"
                name="password"
                value={signupData.password}
                placeholder="Create password"
                onChange={handleChange}
              />
              {error.password && <p className="mt-1 text-sm text-red-400">{error.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <input
                className="w-full rounded-lg border border-gray-700 bg-slate-900 px-4 py-3 text-white placeholder-gray-400 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                type="password"
                name="confirmPassword"
                value={signupData.confirmPassword}
                placeholder="Confirm password"
                onChange={handleChange}
              />
              {error.confirmPassword && <p className="mt-1 text-sm text-red-400">{error.confirmPassword}</p>}
              {error.wrongpass && <p className="mt-1 text-sm text-red-400">{error.wrongpass}</p>}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:shadow-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-700"></div>
              <span className="text-sm text-gray-500">OR</span>
              <div className="h-px flex-1 bg-gray-700"></div>
            </div>

            {/* Login Link */}
            <div className="text-center pt-2">
              <Link to="/" className="text-pink-300 hover:text-pink-200 font-medium">
                Already have an account? Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}