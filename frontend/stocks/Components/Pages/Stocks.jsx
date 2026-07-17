import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { 
    getStocksAPI, 
    getStockChartAPI, 
    getWatchlistAPI, 
    addToWatchlistAPI, 
    removeFromWatchlistAPI,
    buyStockAPI,
    sellStockAPI,
    getMeAPI
} from "../../src/services/api";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Stocks() {
    const context = useOutletContext() || {};
    const { user, setUser } = context;

    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [sector, setSector] = useState("All Sectors");
    const [watchlistSymbols, setWatchlistSymbols] = useState(new Set());

    // Modal States
    const [selectedStock, setSelectedStock] = useState(null);
    const [chartDataPoints, setChartDataPoints] = useState([]);
    const [chartRange, setChartRange] = useState("1mo");
    const [chartLoading, setChartLoading] = useState(false);

    // Trade Modal States
    const [tradeModalOpen, setTradeModalOpen] = useState(false);
    const [tradeType, setTradeType] = useState("BUY");
    const [tradeShares, setTradeShares] = useState(1);
    const [tradeLoading, setTradeLoading] = useState(false);
    const [tradeMessage, setTradeMessage] = useState(null);

    const loadStocksAndWatchlist = async () => {
        try {
            setLoading(true);
            const [stocksData, watchlistData] = await Promise.all([
                getStocksAPI(search, sector),
                getWatchlistAPI().catch(() => [])
            ]);
            setStocks(stocksData || []);
            const symbols = new Set((watchlistData || []).map((w) => w.symbol));
            setWatchlistSymbols(symbols);
        } catch (err) {
            console.error("Error loading stocks:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStocksAndWatchlist();
    }, [search, sector]);

    // Load graph points and auto-poll every 30s when modal is open
    useEffect(() => {
        if (!selectedStock) return;
        let isMounted = true;

        const fetchLatestChartData = async (showLoadingSpinner = false) => {
            if (showLoadingSpinner) setChartLoading(true);
            try {
                const res = await getStockChartAPI(selectedStock.symbol, chartRange);
                if (isMounted && res.data) {
                    setChartDataPoints(res.data);
                }
            } catch (err) {
                console.error("Chart polling error:", err);
                if (isMounted && showLoadingSpinner) setChartDataPoints([]);
            } finally {
                if (isMounted && showLoadingSpinner) setChartLoading(false);
            }
        };

        // 1st Fetch immediately with loading spinner
        fetchLatestChartData(true);

        // 2. Background polling loop every 30 seconds
        const intervalId = setInterval(() => {
            if (!document.hidden && isMounted) {
                fetchLatestChartData(false);
            }
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [selectedStock, chartRange]);

    const handleToggleWatchlist = async (e, stock) => {
        e.stopPropagation();
        try {
            if (watchlistSymbols.has(stock.symbol)) {
                await removeFromWatchlistAPI(stock.symbol);
                setWatchlistSymbols(prev => {
                    const next = new Set(prev);
                    next.delete(stock.symbol);
                    return next;
                });
            } else {
                await addToWatchlistAPI({ symbol: stock.symbol, companyName: stock.companyName });
                setWatchlistSymbols(prev => new Set(prev).add(stock.symbol));
            }
        } catch (err) {
            console.error("Watchlist toggle error:", err);
        }
    };

    const handleExecuteTrade = async (e) => {
        e.preventDefault();
        if (!selectedStock || tradeShares <= 0) return;
        setTradeLoading(true);
        setTradeMessage(null);
        try {
            if (tradeType === "BUY") {
                const res = await buyStockAPI({
                    symbol: selectedStock.symbol,
                    companyName: selectedStock.companyName,
                    sector: selectedStock.sector,
                    shares: Number(tradeShares),
                    price: Number(selectedStock.price)
                });
                setTradeMessage({ type: "success", text: res.message });
                if (setUser && res.newBalance !== undefined) {
                    setUser(prev => ({ ...prev, balance: res.newBalance }));
                } else if (setUser) {
                    getMeAPI().then(setUser);
                }
            } else {
                const res = await sellStockAPI({
                    symbol: selectedStock.symbol,
                    shares: Number(tradeShares),
                    price: Number(selectedStock.price)
                });
                setTradeMessage({ type: "success", text: res.message });
                if (setUser && res.newBalance !== undefined) {
                    setUser(prev => ({ ...prev, balance: res.newBalance }));
                } else if (setUser) {
                    getMeAPI().then(setUser);
                }
            }
        } catch (err) {
            setTradeMessage({ type: "error", text: err.message });
        } finally {
            setTradeLoading(false);
        }
    };

    // Prepare Chart.js data object
    const chartConfig = {
        labels: chartDataPoints.map(p => {
            const d = new Date(p.timestamp);
            if (chartRange === "1d") return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: selectedStock ? `${selectedStock.symbol} Price (₹)` : "Price",
                data: chartDataPoints.map(p => p.price),
                borderColor: (selectedStock?.change || 0) >= 0 ? "#10b981" : "#ef4444",
                backgroundColor: (selectedStock?.change || 0) >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                fill: true,
                tension: 0.3,
                pointRadius: chartDataPoints.length > 25 ? 1 : 3,
                pointHoverRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#0f172a",
                titleColor: "#e2e8f0",
                bodyColor: "#10b981",
                borderColor: "#334155",
                borderWidth: 1,
            },
        },
        scales: {
            x: {
                grid: { display: false, borderColor: "#334155" },
                ticks: { color: "#64748b", maxTicksLimit: 8 },
            },
            y: {
                grid: { color: "rgba(51, 65, 85, 0.4)", borderColor: "#334155" },
                ticks: { color: "#64748b" },
            },
        },
    };

    const totalGainers = stocks.filter(s => s.change >= 0).length;
    const totalVolume = stocks.reduce((acc, s) => acc + (s.volume || 0), 0);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-2 md:p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Stocks & Market Directory</h1>
                    <p className="text-gray-400 mt-1">Track live market quotes, inspect historical graphs, and execute instant paper trades</p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
                <div className="relative w-full md:w-96">
                    <input
                        className="w-full bg-slate-950 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition"
                        placeholder="Search stocks by symbol or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button 
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-white text-sm"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <select
                    className="w-full md:w-auto bg-slate-950 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 transition cursor-pointer"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                >
                    <option value="All Sectors">All Sectors</option>
                    <option value="Technology">Technology</option>
                    <option value="Automobile">Automobile</option>
                    <option value="Energy">Energy</option>
                    <option value="Consumer">Consumer</option>
                    <option value="General">General</option>
                </select>
            </div>

            {/* Stock Table */}
            <div className="mt-8 bg-slate-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-gray-400 border-b border-gray-800 text-sm uppercase">
                            <tr>
                                <th className="py-4 font-semibold">Company</th>
                                <th className="font-semibold">Sector</th>
                                <th className="font-semibold">Price</th>
                                <th className="font-semibold">Volume</th>
                                <th className="font-semibold">24h Change</th>
                                <th className="font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-400 animate-pulse">
                                        Loading market data...
                                    </td>
                                </tr>
                            ) : stocks.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-500">
                                        No stocks found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                stocks.map((s) => {
                                    const isPositive = (s.change || 0) >= 0;
                                    const isWatchlisted = watchlistSymbols.has(s.symbol);
                                    return (
                                        <tr 
                                            key={s._id || s.symbol}
                                            onClick={() => { setSelectedStock(s); setChartRange("1mo"); }}
                                            className="hover:bg-white/5 transition cursor-pointer group"
                                        >
                                            <td className="py-4">
                                                <div>
                                                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition">
                                                        {s.companyName}
                                                    </h3>
                                                    <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-gray-300">
                                                        {s.symbol}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-gray-300 text-sm">
                                                {s.sector}
                                            </td>
                                            <td className="font-bold text-white">
                                                ₹{Number(s.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-gray-400 text-sm">
                                                {s.volume ? (s.volume / 1000000).toFixed(2) + "M" : "1.2M"}
                                            </td>
                                            <td className={`font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                                                <div className="flex items-center gap-1">
                                                    <span>{isPositive ? "+" : ""}₹{s.change}</span>
                                                    <span className="text-xs opacity-80">({isPositive ? "+" : ""}{s.changePercent}%)</span>
                                                </div>
                                            </td>
                                            <td className="text-right space-x-2 py-4" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => handleToggleWatchlist(e, s)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                                                        isWatchlisted 
                                                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40" 
                                                            : "bg-slate-800 text-gray-300 hover:text-white border-gray-700"
                                                    }`}
                                                >
                                                    {isWatchlisted ? "★ Watchlisted" : "+ Watchlist"}
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedStock(s); setChartRange("1mo"); }}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
                                                >
                                                    Chart & Trade
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                    <p className="text-gray-400 text-sm">Total Listed Stocks</p>
                    <h2 className="text-3xl font-bold mt-2 text-white">{stocks.length}</h2>
                </div>
                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                    <p className="text-gray-400 text-sm">Top Gainers Today</p>
                    <h2 className="text-3xl font-bold mt-2 text-emerald-400">{totalGainers}</h2>
                </div>
                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                    <p className="text-gray-400 text-sm">Total Market Volume</p>
                    <h2 className="text-3xl font-bold mt-2 text-cyan-400">{(totalVolume / 1000000).toFixed(1)}M</h2>
                </div>
            </div>

            {/* Stock Detail & Interactive Chart Modal */}
            {selectedStock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-gray-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl relative my-8 animate-fadeIn">
                        {/* Close Button */}
                        <button
                            onClick={() => { setSelectedStock(null); setTradeModalOpen(false); setTradeMessage(null); }}
                            className="absolute top-5 right-5 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-gray-300 hover:text-white transition cursor-pointer"
                        >
                            ✕
                        </button>

                        {/* Modal Header */}
                        <div className="flex flex-wrap justify-between items-center pr-12 gap-4 border-b border-gray-800 pb-5">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl sm:text-3xl font-black text-white">{selectedStock.companyName}</h2>
                                    <span className="bg-slate-800 border border-gray-700 text-gray-300 px-3 py-1 rounded-lg font-mono text-sm">
                                        {selectedStock.symbol}
                                    </span>
                                </div>
                                <span className="text-xs text-emerald-400 mt-1 inline-block uppercase tracking-wider font-semibold">
                                    {selectedStock.sector} Sector
                                </span>
                            </div>

                            <div className="text-left sm:text-right">
                                <div className="text-3xl font-bold text-white">
                                    ₹{Number(selectedStock.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className={`text-sm font-semibold mt-0.5 ${(selectedStock.change || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {(selectedStock.change || 0) >= 0 ? "+" : ""}₹{selectedStock.change} ({(selectedStock.change || 0) >= 0 ? "+" : ""}{selectedStock.changePercent}%)
                                </div>
                            </div>
                        </div>

                        {/* Timeframe Selectors */}
                        <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
                            <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">Historical Price Graph</h3>
                            <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-gray-800">
                                {["1d", "1w", "1mo", "1y"].map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => setChartRange(r)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                                            chartRange === r
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                                                : "text-gray-400 hover:text-white hover:bg-slate-900"
                                        }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="h-72 w-full mt-4 bg-slate-950/60 rounded-2xl p-4 border border-gray-800 relative">
                            {chartLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 animate-pulse font-medium">
                                    Generating chart data from API...
                                </div>
                            ) : chartDataPoints.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                    Chart data not available for this period.
                                </div>
                            ) : (
                                <Line data={chartConfig} options={chartOptions} />
                            )}
                        </div>

                        {/* Trade Section inside Modal */}
                        <div className="mt-6 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-400">
                                Ready to invest? Buy or Sell shares instantly using paper cash.
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    onClick={(e) => handleToggleWatchlist(e, selectedStock)}
                                    className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer text-sm"
                                >
                                    {watchlistSymbols.has(selectedStock.symbol) ? "★ Watchlisted" : "+ Watchlist"}
                                </button>
                                <button
                                    onClick={() => { setTradeModalOpen(!tradeModalOpen); setTradeMessage(null); }}
                                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer text-sm"
                                >
                                    {tradeModalOpen ? "Close Trade Box" : "Trade Shares"}
                                </button>
                            </div>
                        </div>

                        {/* Trade Form Collapsible */}
                        {tradeModalOpen && (
                            <div className="mt-5 p-5 bg-slate-950 rounded-2xl border border-gray-800 animate-fadeIn">
                                <h4 className="font-bold text-white mb-4">Execute Order for {selectedStock.symbol}</h4>
                                
                                {tradeMessage && (
                                    <div className={`mb-4 p-3 rounded-xl text-sm ${tradeMessage.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                                        {tradeMessage.text}
                                    </div>
                                )}

                                <form onSubmit={handleExecuteTrade} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">Order Type</label>
                                        <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-gray-800">
                                            <button
                                                type="button"
                                                onClick={() => setTradeType("BUY")}
                                                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${tradeType === "BUY" ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-white"}`}
                                            >
                                                BUY
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTradeType("SELL")}
                                                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${tradeType === "SELL" ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"}`}
                                            >
                                                SELL
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">Number of Shares</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={tradeShares}
                                            onChange={(e) => setTradeShares(Math.max(1, parseInt(e.target.value) || 1))}
                                            className="w-full bg-slate-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1.5 font-medium">Estimated Total</label>
                                        <div className="w-full bg-slate-900/60 border border-gray-800 rounded-xl px-4 py-2.5 font-bold text-white">
                                            ₹{(tradeShares * selectedStock.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={tradeLoading}
                                            className={`w-full py-3 rounded-xl font-bold text-white transition shadow-lg cursor-pointer disabled:opacity-50 ${tradeType === "BUY" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"}`}
                                        >
                                            {tradeLoading ? "Processing..." : `${tradeType} ${selectedStock.symbol}`}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}