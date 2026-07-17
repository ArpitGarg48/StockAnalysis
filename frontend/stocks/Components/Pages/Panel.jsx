import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { getMeAPI } from "../../src/services/api";

export default function Panel() {
    let navigate = useNavigate();
    let location = useLocation();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error(e);
            }
        }

        // Fetch fresh user data from backend
        getMeAPI()
            .then((data) => {
                setUser(data);
                localStorage.setItem("user", JSON.stringify(data));
            })
            .catch((err) => {
                console.error("Auth verify error:", err);
                if (err.message.includes("authorized") || err.message.includes("token")) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/");
                }
            });
    }, [navigate, location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex">
            {/* Sidebar */}
            <aside className="hidden md:flex w-72 bg-slate-900 border-r border-gray-800 flex-col p-6 justify-between">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer"
                        onClick={() => navigate("/panel")}>
                        StockFlow
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Stock Market & Portfolio
                    </p>

                    {/* User Profile Card */}
                    {user && (
                        <div className="mt-6 p-4 rounded-2xl bg-slate-950/60 border border-gray-800 flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="font-semibold text-sm truncate">{user.name}</h4>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-800/80 flex justify-between items-center text-xs">
                                <span className="text-gray-400">Cash Balance:</span>
                                <span className="font-bold text-emerald-400">
                                    ₹{user.balance !== undefined ? Number(user.balance).toLocaleString('en-IN') : "---"}
                                </span>
                            </div>
                        </div>
                    )}

                    <nav className="mt-8 space-y-3">
                        <button 
                            className={`w-full text-left px-4 py-3 rounded-xl transition cursor-pointer font-medium ${
                                location.pathname === "/panel"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "text-gray-300 hover:bg-white/5"
                            }`}
                            onClick={() => navigate("/panel")}
                        >
                            Dashboard
                        </button>

                        <button 
                            className={`w-full text-left px-4 py-3 rounded-xl transition cursor-pointer font-medium ${
                                location.pathname.includes("/panel/stocks")
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "text-gray-300 hover:bg-white/5"
                            }`}
                            onClick={() => navigate("/panel/stocks")}
                        >
                            Stocks & Charts
                        </button>

                        <button 
                            className={`w-full text-left px-4 py-3 rounded-xl transition cursor-pointer font-medium ${
                                location.pathname.includes("/panel/portfolio")
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "text-gray-300 hover:bg-white/5"
                            }`}
                            onClick={() => navigate("/panel/portfolio")}
                        >
                            Portfolio & Holdings
                        </button>
                    </nav>
                </div>

                {/* Logout Button */}
                <div className="pt-6 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer font-medium text-sm"
                    >
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 p-6 overflow-y-auto max-h-screen">
                <Outlet context={{ user, setUser }} />
            </main>
        </div>
    );
}