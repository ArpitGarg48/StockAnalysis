import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { getPortfolioAPI, getTransactionsAPI, buyStockAPI, sellStockAPI } from "../../src/services/api";

export default function Portfolio() {
    const navigate = useNavigate();
    const context = useOutletContext() || {};
    const { user, setUser } = context;

    const [portfolio, setPortfolio] = useState({ holdings: [], totalInvestment: 0, currentValue: 0, totalProfitLoss: 0, profitLossPercent: 0 });
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState("holdings");
    const [loading, setLoading] = useState(true);

    // Trade Modal
    const [selectedHolding, setSelectedHolding] = useState(null);
    const [tradeType, setTradeType] = useState("BUY");
    const [tradeShares, setTradeShares] = useState(1);
    const [tradeLoading, setTradeLoading] = useState(false);
    const [tradeMessage, setTradeMessage] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [portData, txData] = await Promise.all([
                getPortfolioAPI().catch(() => ({ holdings: [], totalInvestment: 0, currentValue: 0, totalProfitLoss: 0, profitLossPercent: 0 })),
                getTransactionsAPI().catch(() => [])
            ]);
            const summary = portData?.summary || {};
            setPortfolio({
                holdings: (portData?.holdings || []).map(h => ({
                    ...h,
                    averageCost: h.averageCost ?? h.averageBuyPrice ?? 0,
                    totalValue: h.totalValue ?? h.currentValue ?? 0
                })),
                totalInvestment: portData?.totalInvestment ?? summary?.totalInvested ?? 0,
                currentValue: portData?.currentValue ?? summary?.totalCurrentValue ?? 0,
                totalProfitLoss: portData?.totalProfitLoss ?? summary?.totalProfitLoss ?? 0,
                profitLossPercent: portData?.profitLossPercent ?? summary?.totalProfitLossPercent ?? 0
            });
            setTransactions(txData || []);
        } catch (err) {
            console.error("Portfolio load error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleTradeHolding = async (e) => {
        e.preventDefault();
        if (!selectedHolding || tradeShares <= 0) return;
        setTradeLoading(true);
        setTradeMessage(null);
        try {
            if (tradeType === "BUY") {
                const res = await buyStockAPI({
                    symbol: selectedHolding.symbol,
                    companyName: selectedHolding.companyName,
                    sector: selectedHolding.sector || "General",
                    shares: Number(tradeShares),
                    price: Number(selectedHolding.currentPrice)
                });
                setTradeMessage({ type: "success", text: res.message });
                if (setUser && res.newBalance !== undefined) setUser(prev => ({ ...prev, balance: res.newBalance }));
                await loadData();
            } else {
                const res = await sellStockAPI({
                    symbol: selectedHolding.symbol,
                    shares: Number(tradeShares),
                    price: Number(selectedHolding.currentPrice)
                });
                setTradeMessage({ type: "success", text: res.message });
                if (setUser && res.newBalance !== undefined) setUser(prev => ({ ...prev, balance: res.newBalance }));
                await loadData();
            }
        } catch (err) {
            setTradeMessage({ type: "error", text: err.message });
        } finally {
            setTradeLoading(false);
        }
    };

    const isProfit = portfolio.totalProfitLoss >= 0;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-2 md:p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">My Portfolio & Holdings</h1>
                    <p className="text-gray-400 mt-1">Review live valuation of your assets, inspect profit/loss performance, and check trade history</p>
                </div>
                <button
                    onClick={() => navigate("/panel/stocks")}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                    + Buy New Stocks
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Invested</p>
                    <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white">
                        ₹{Number(portfolio.totalInvestment || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Book value of all purchased shares</p>
                </div>

                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Current Portfolio Value</p>
                    <h2 className="text-2xl sm:text-3xl font-black mt-2 text-cyan-400">
                        ₹{Number(portfolio.currentValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Based on live market prices</p>
                </div>

                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Profit / Loss</p>
                    <h2 className={`text-2xl sm:text-3xl font-black mt-2 ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                        {isProfit ? "+" : ""}₹{Number(portfolio.totalProfitLoss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                    <p className={`text-xs font-semibold mt-1 ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                        {isProfit ? "▲" : "▼"} {(portfolio.profitLossPercent || 0).toFixed(2)}% overall return
                    </p>
                </div>

                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Holdings Count</p>
                    <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white">
                        {portfolio.holdings?.length || 0}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Active unique stock symbols</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-800 mb-6">
                <button
                    onClick={() => setActiveTab("holdings")}
                    className={`pb-3 font-semibold text-sm transition cursor-pointer border-b-2 ${
                        activeTab === "holdings"
                            ? "border-emerald-500 text-emerald-400"
                            : "border-transparent text-gray-400 hover:text-white"
                    }`}
                >
                    Active Holdings ({portfolio.holdings?.length || 0})
                </button>
                <button
                    onClick={() => setActiveTab("transactions")}
                    className={`pb-3 font-semibold text-sm transition cursor-pointer border-b-2 ${
                        activeTab === "transactions"
                            ? "border-emerald-500 text-emerald-400"
                            : "border-transparent text-gray-400 hover:text-white"
                    }`}
                >
                    Trade History Log ({transactions.length})
                </button>
            </div>

            {/* Tab 1: Holdings Table */}
            {activeTab === "holdings" && (
                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-gray-400 border-b border-gray-800 text-sm uppercase">
                                <tr>
                                    <th className="py-4 font-semibold">Stock</th>
                                    <th className="font-semibold">Shares</th>
                                    <th className="font-semibold">Avg Cost</th>
                                    <th className="font-semibold">Live Price</th>
                                    <th className="font-semibold">Total Value</th>
                                    <th className="font-semibold">Profit / Loss</th>
                                    <th className="font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-400 animate-pulse">Loading holdings...</td>
                                    </tr>
                                ) : portfolio.holdings?.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500">
                                            You don't own any stocks yet. Click "+ Buy New Stocks" to start building your portfolio.
                                        </td>
                                    </tr>
                                ) : (
                                    portfolio.holdings.map((h) => {
                                        const hProfit = (h.profitLoss || 0) >= 0;
                                        return (
                                            <tr key={h.symbol} className="hover:bg-white/5 transition">
                                                <td className="py-4">
                                                    <div className="font-bold text-white">{h.companyName}</div>
                                                    <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-gray-300">{h.symbol}</span>
                                                </td>
                                                <td className="font-semibold text-white">{h.shares}</td>
                                                <td className="text-gray-300">₹{Number(h.averageCost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="font-bold text-white">₹{Number(h.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="font-bold text-cyan-400">₹{Number(h.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className={`font-bold ${hProfit ? "text-emerald-400" : "text-red-400"}`}>
                                                    <div>{hProfit ? "+" : ""}₹{Number(h.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                    <div className="text-xs opacity-80">({hProfit ? "+" : ""}{h.profitLossPercent}%)</div>
                                                </td>
                                                <td className="text-right py-4">
                                                    <button
                                                        onClick={() => { setSelectedHolding(h); setTradeMessage(null); }}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition cursor-pointer"
                                                    >
                                                        Trade Shares
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
            )}

            {/* Tab 2: Transactions Log */}
            {activeTab === "transactions" && (
                <div className="bg-slate-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-gray-400 border-b border-gray-800 text-sm uppercase">
                                <tr>
                                    <th className="py-4 font-semibold">Type</th>
                                    <th className="font-semibold">Symbol</th>
                                    <th className="font-semibold">Company Name</th>
                                    <th className="font-semibold">Shares</th>
                                    <th className="font-semibold">Execution Price</th>
                                    <th className="font-semibold">Total Order Value</th>
                                    <th className="font-semibold text-right">Date & Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-400 animate-pulse">Loading transaction log...</td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500">No trading history recorded yet.</td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => {
                                        const isBuy = tx.type === "BUY";
                                        return (
                                            <tr key={tx._id} className="hover:bg-white/5 transition">
                                                <td className="py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${isBuy ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="font-mono font-bold text-white">{tx.symbol}</td>
                                                <td className="text-gray-300">{tx.companyName}</td>
                                                <td className="font-semibold text-white">{tx.shares}</td>
                                                <td className="text-gray-300">₹{Number(tx.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="font-bold text-white">₹{Number(tx.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="text-right text-xs text-gray-400">{new Date(tx.createdAt || tx.timestamp || Date.now()).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Trade Modal for Holding */}
            {selectedHolding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative my-8 animate-fadeIn">
                        <button
                            onClick={() => { setSelectedHolding(null); setTradeMessage(null); }}
                            className="absolute top-5 right-5 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-gray-300 hover:text-white transition cursor-pointer"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl font-bold text-white mb-2">Trade {selectedHolding.symbol}</h3>
                        <p className="text-xs text-gray-400 mb-4">You currently own <strong className="text-white">{selectedHolding.shares}</strong> shares at avg cost ₹{selectedHolding.averageCost}</p>

                        {tradeMessage && (
                            <div className={`mb-4 p-3 rounded-xl text-sm ${tradeMessage.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                                {tradeMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleTradeHolding} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Order Action</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setTradeType("BUY")}
                                        className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${tradeType === "BUY" ? "bg-emerald-500 text-white" : "text-gray-400 hover:text-white"}`}
                                    >
                                        BUY MORE
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTradeType("SELL")}
                                        className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${tradeType === "SELL" ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"}`}
                                    >
                                        SELL SHARES
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Number of Shares</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={tradeType === "SELL" ? selectedHolding.shares : 100000}
                                    value={tradeShares}
                                    onChange={(e) => setTradeShares(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full bg-slate-950 border border-gray-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="bg-slate-950 p-3 rounded-xl border border-gray-800 flex justify-between text-sm">
                                <span className="text-gray-400">Estimated Total:</span>
                                <span className="font-bold text-white">₹{(tradeShares * selectedHolding.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>

                            <button
                                type="submit"
                                disabled={tradeLoading}
                                className={`w-full py-3 rounded-xl font-bold text-white transition shadow-lg cursor-pointer disabled:opacity-50 ${tradeType === "BUY" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-red-500 hover:bg-red-600 shadow-red-500/20"}`}
                            >
                                {tradeLoading ? "Processing..." : `Execute ${tradeType}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}