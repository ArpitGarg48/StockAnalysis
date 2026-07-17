import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { loginAPI } from "../../src/services/api";

export default function Login() {
    let [loginData, setLoginData] = useState({ email: '', password: '' });
    let [error, setError] = useState({});
    let [loading, setLoading] = useState(false);
    let navigate = useNavigate();

    let handelChange = (e) => {
        let { name, value } = e.target;
        setLoginData({ ...loginData, [name]: value });
        setError({ ...error, [name]: null, general: null });
    };

    let handleValidateAndSubmit = async (e) => {
        if (e) e.preventDefault();
        let formError = {};

        if (!loginData.email) {
            formError.email = "Email is required";
        }
        if (!loginData.password) {
            formError.password = "Password is required";
        }

        if (Object.keys(formError).length > 0) {
            setError(formError);
            return;
        }

        try {
            setLoading(true);
            setError({});
            const res = await loginAPI(loginData);
            localStorage.setItem("token", res.token);
            localStorage.setItem("user", JSON.stringify(res));
            console.log("Logged in successfully:", res);
            navigate("/panel");
        } catch (err) {
            console.error("Login error:", err);
            setError({ general: err.message || "Login failed. Check credentials." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-slate-950 w-auto">
            {/* Left Section */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900 text-white">
                <div>
                    <h1 className="text-6xl font-black leading-tight">
                        Welcome
                        <br />
                        Back
                    </h1>
                    <p className="mt-6 max-w-md text-lg text-emerald-100">
                        Login and continue your journey with us. Manage your portfolio securely and access live market graphs and analytics in one place.
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.88 17.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white">
                            Sign in to your account
                        </h1>
                        <p className="mt-2 text-gray-400">
                            Enter your details below to access your portfolio
                        </p>
                    </div>

                    {error.general && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
                            <span>⚠️</span>
                            <span>{error.general}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleValidateAndSubmit} className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">
                                Email Address
                            </label>
                            <input
                                className="w-full rounded-lg border border-gray-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                                name="email"
                                type="email"
                                value={loginData.email}
                                placeholder="Enter your email"
                                onChange={handelChange}
                            />
                            {error.email && <p className="mt-1 text-sm text-red-400">{error.email}</p>}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-300">
                                Password
                            </label>
                            <input
                                className="w-full rounded-lg border border-gray-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                                name="password"
                                type="password"
                                value={loginData.password}
                                placeholder="Enter your password"
                                onChange={handelChange}
                            />
                            {error.password && <p className="mt-1 text-sm text-red-400">{error.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-1 hover:shadow-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-gray-700"></div>
                            <span className="text-sm text-gray-500">OR</span>
                            <div className="h-px flex-1 bg-gray-700"></div>
                        </div>

                        <div className="text-center pt-2">
                            <Link to="/signup" className="text-pink-300 hover:text-pink-200 font-medium">
                                Don't have an account? Sign Up
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}