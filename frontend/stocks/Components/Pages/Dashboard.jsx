import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getPortfolioAPI, getWatchlistAPI, getStocksAPI } from "../../src/services/api";

export default function Dashboard() {
    const navigate = useNavigate();
    const context = useOutletContext() || {};
    const { user } = context;

    const [portfolio, setPortfolio] = useState({ holdings: [], totalInvestment: 0, currentValue: 0, totalProfitLoss: 0, profitLossPercent: 0 });
    const [watchlist, setWatchlist] = useState([]);
    const [topMovers, setTopMovers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        Promise.all([
            getPortfolioAPI().catch(() => ({ holdings: [], totalInvestment: 0, currentValue: 0, totalProfitLoss: 0, profitLossPercent: 0 })),
            getWatchlistAPI().catch(() => []),
            getStocksAPI().catch(() => [])
        ]).then(([portData, watchData, stocksData]) => {
            if (!isMounted) return;
            const summary = portData?.summary || {};
            setPortfolio({
                holdings: portData?.holdings || [],
                totalInvestment: portData?.totalInvestment ?? summary?.totalInvested ?? 0,
                currentValue: portData?.currentValue ?? summary?.totalCurrentValue ?? 0,
                totalProfitLoss: portData?.totalProfitLoss ?? summary?.totalProfitLoss ?? 0,
                profitLossPercent: portData?.profitLossPercent ?? summary?.totalProfitLossPercent ?? 0
            });
            setWatchlist(watchData || []);
            // Sort by absolute percentage change or gainers
            const sorted = [...(stocksData || [])].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
            setTopMovers(sorted);
        }).finally(() => {
            if (isMounted) setLoading(false);
        });
        return () => { isMounted = false; };
    }, []);

    const isProfit = portfolio.totalProfitLoss >= 0;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-2 md:p-6 pb-20">
            {/* Top Welcome Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black">
                        Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{user?.name || "Investor"}</span> 👋
                    </h1>
                    <p className="text-gray-400 mt-1">Here is the live performance overview of your investments and market watch</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate("/panel/stocks")}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                    >
                        + Explore Market
                    </button>
                    <button
                        onClick={() => navigate("/panel/portfolio")}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 border border-gray-700 hover:bg-slate-800 text-white font-semibold text-sm transition cursor-pointer"
                    >
                        My Holdings
                    </button>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Available Cash Balance</p>
                    <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white">
                        ₹{user?.balance !== undefined ? Number(user.balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "1,00,000.00"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-2">Ready for paper trading</p>
                </div>

                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition"></div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Invested Capital</p>
                    <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white">
                        ₹{Number(portfolio.totalInvestment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-gray-500 mt-2">Across {portfolio.holdings?.length || 0} active holdings</p>
                </div>

                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition"></div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Current Portfolio Value</p>
                    <h2 className="text-2xl sm:text-3xl font-black mt-2 text-cyan-400">
                        ₹{Number(portfolio.currentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-gray-500 mt-2">Live real-time assessment</p>
                </div>

                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 h-24 w-24 ${isProfit ? "bg-emerald-500/5 group-hover:bg-emerald-500/10" : "bg-red-500/5 group-hover:bg-red-500/10"} rounded-full blur-2xl transition`}></div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Profit / Loss</p>
                    <h2 className={`text-2xl sm:text-3xl font-black mt-2 ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                        {isProfit ? "+" : ""}₹{Number(portfolio.totalProfitLoss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <div className={`text-xs font-bold mt-2 flex items-center gap-1 ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                        <span>{isProfit ? "▲" : "▼"} {isProfit ? "+" : ""}{(portfolio.profitLossPercent || 0).toFixed(2)}% overall return</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Columns: Top Market Movers */}
                <div className="lg:col-span-2 bg-slate-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">Top Market Gainers & Movers</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Real-time quotes from active market sessions</p>
                        </div>
                        <button
                            onClick={() => navigate("/panel/stocks")}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                        >
                            View All Stocks →
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-gray-400 animate-pulse text-sm">
                            Loading market movers...
                        </div>
                    ) : topMovers.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 text-sm">
                            No market data available.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {topMovers.map((s) => {
                                const isPos = (s.change || 0) >= 0;
                                return (
                                    <div
                                        key={s.symbol}
                                        onClick={() => navigate("/panel/stocks")}
                                        className="bg-slate-950/70 hover:bg-slate-950 border border-gray-800/80 rounded-xl p-4 transition cursor-pointer flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-white group-hover:text-emerald-400 transition">{s.symbol}</h4>
                                                <span className="text-[10px] uppercase font-semibold bg-slate-800 text-gray-300 px-1.5 py-0.5 rounded">{s.sector}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate max-w-[150px] mt-1">{s.companyName}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-white">₹{Number(s.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            <div className={`text-xs font-semibold mt-0.5 ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                                                {isPos ? "+" : ""}₹{s.change} ({isPos ? "+" : ""}{s.changePercent}%)
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Column: Watchlist Summary */}
                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Watchlist Preview</h3>
                                <p className="text-xs text-gray-400 mt-0.5">Stocks you are closely monitoring</p>
                            </div>
                            <span className="text-xs bg-slate-800 text-gray-300 px-2 py-1 rounded-lg font-mono">
                                {watchlist.length}
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-8 text-center text-gray-400 animate-pulse text-sm">Loading watchlist...</div>
                        ) : watchlist.length === 0 ? (
                            <div className="py-8 text-center text-gray-500 text-sm">
                                Your watchlist is empty. Go to Stocks directory to bookmark symbols.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {watchlist.map((w) => {
                                    const isPos = (w.change || 0) >= 0;
                                    return (
                                        <div
                                            key={w.symbol}
                                            onClick={() => navigate("/panel/stocks")}
                                            className="p-3 bg-slate-950/60 hover:bg-slate-950 border border-gray-800 rounded-xl flex justify-between items-center transition cursor-pointer"
                                        >
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{w.symbol}</h4>
                                                <p className="text-xs text-gray-400 truncate max-w-[120px]">{w.companyName}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-white text-sm">₹{Number(w.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                <div className={`text-xs font-medium ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                                                    {isPos ? "+" : ""}{w.changePercent}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate("/panel/stocks")}
                        className="w-full mt-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition cursor-pointer"
                    >
                        Manage Watchlist →
                    </button>
                </div>
            </div>
        </div>
    );
}