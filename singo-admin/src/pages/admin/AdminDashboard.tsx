import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api/axios";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { ShieldAlert, History, RefreshCw, Map } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

type Stats = {
  totalRevenue: number;
  codRevenue: number;
  paidRevenue: number;
  totalDeliveries: number;
  completedDeliveries: number;
  totalCompanies: number;
  totalDrivers: number;
  pendingSettlementAmount: number;
  pendingPaidDeliveryCharges: number;
};

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
  return 0;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    codRevenue: 0,
    paidRevenue: 0,
    totalDeliveries: 0,
    completedDeliveries: 0,
    totalCompanies: 0,
    totalDrivers: 0,
    pendingSettlementAmount: 0,
    pendingPaidDeliveryCharges: 0,
  });

  const [settlements, setSettlements] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const refresh = () => loadData();

    refresh();

    const handleRefresh = () => refresh();
    window.addEventListener("dashboard:refresh", handleRefresh);

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadData();
      }, 5000); // Refresh every 5 seconds for real-time updates
    }

    return () => {
      window.removeEventListener("dashboard:refresh", handleRefresh);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [statsRes, settlementsRes, blacklistRes, trendRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/settlements/admin/all"),
        api.get("/admin/blacklist"),
        api.get("/analytics/trend?months=6"),
      ]);

      const statsData: Stats = {
        totalRevenue: toNumber(statsRes.data?.totalRevenue),
        codRevenue: toNumber(statsRes.data?.codRevenue),
        paidRevenue: toNumber(statsRes.data?.paidRevenue),
        totalDeliveries: statsRes.data?.totalDeliveries || 0,
        completedDeliveries: statsRes.data?.completedDeliveries || 0,
        totalCompanies: statsRes.data?.totalCompanies || 0,
        totalDrivers: statsRes.data?.totalDrivers || 0,
        pendingSettlementAmount: toNumber(statsRes.data?.pendingSettlementAmount),
        pendingPaidDeliveryCharges: toNumber(statsRes.data?.pendingPaidDeliveryCharges),
      };

      setStats(statsData);

      const settlementsData = Array.isArray(settlementsRes.data)
        ? settlementsRes.data
        : [];
      setSettlements(settlementsData);

      const blacklistData = Array.isArray(blacklistRes.data)
        ? blacklistRes.data
        : [];
      setBlacklist(blacklistData);

      const trendData = Array.isArray(trendRes.data) ? trendRes.data : [];
      setMonthlyTrend(trendData);

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      setSettlements([]);
      setBlacklist([]);
      setMonthlyTrend([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: monthlyTrend.length > 0
      ? monthlyTrend.map((t) => t.shortMonth)
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Total Revenue (Rs.)",
        data: monthlyTrend.length > 0
          ? monthlyTrend.map((t) => toNumber(t.revenue))
          : [0, 0, 0, 0, 0, 0],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "COD Revenue (Rs.)",
        data: monthlyTrend.length > 0
          ? monthlyTrend.map((t) => toNumber(t.codRevenue))
          : [0, 0, 0, 0, 0, 0],
        borderColor: "#f97316",
        backgroundColor: "rgba(249,115,22,0.1)",
        tension: 0.4,
      },
      {
        label: "PAID Revenue (Rs.)",
        data: monthlyTrend.length > 0
          ? monthlyTrend.map((t) => toNumber(t.paidRevenue))
          : [0, 0, 0, 0, 0, 0],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.1)",
        tension: 0.4,
      },
    ],
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time delivery network status
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Last updated: {formatTime(lastUpdate)} 
              {autoRefresh && <span className="ml-2 inline-block">🔄 Auto-refreshing</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/admin/dashboard/tracking")}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold flex items-center gap-2 transition shadow-md"
            >
              <Map size={18} />
              Track Deliveries
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-semibold text-white flex items-center gap-2 transition shadow-md ${
                autoRefresh
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              <RefreshCw size={18} className={autoRefresh ? "animate-spin" : ""} />
              {autoRefresh ? "Auto: ON" : "Auto: OFF"}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center gap-2 transition shadow-md"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh Now
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-orange-50 dark:bg-slate-900 p-6 rounded-xl shadow-md border border-orange-200 dark:border-slate-700 hover:shadow-lg transition">
            <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
              COD Revenue (Unsettled)
            </p>
            <h2 className="text-3xl font-bold mt-2 text-orange-700 dark:text-orange-300">
              Rs.{stats.codRevenue.toFixed(2)}
            </h2>
          </div>

          <div className="bg-green-50 dark:bg-slate-900 p-6 rounded-xl shadow-md border border-green-200 dark:border-slate-700 hover:shadow-lg transition">
            <p className="text-green-600 dark:text-green-400 text-sm font-medium">
              PAID Delivery Charges (Unsettled)
            </p>
            <h2 className="text-3xl font-bold mt-2 text-green-700 dark:text-green-300">
              Rs.{stats.pendingPaidDeliveryCharges.toFixed(2)}
            </h2>
          </div>

          <div className="bg-blue-50 dark:bg-slate-900 p-6 rounded-xl shadow-md border border-blue-200 dark:border-slate-700 hover:shadow-lg transition">
            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              Completed Deliveries
            </p>
            <h2 className="text-3xl font-bold mt-2 text-blue-700 dark:text-blue-300">
              {stats.completedDeliveries}
            </h2>
          </div>

          <div className="bg-purple-50 dark:bg-slate-900 p-6 rounded-xl shadow-md border border-purple-200 dark:border-slate-700 hover:shadow-lg transition">
            <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
              Pending Settlements
            </p>
            <h2 className="text-3xl font-bold mt-2 text-purple-700 dark:text-purple-300">
              Rs.{stats.pendingSettlementAmount.toFixed(2)}
            </h2>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-800 hover:shadow-lg transition">
            <div className="flex items-center gap-2 mb-6">
              <History className="text-blue-600" size={24} />
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Recent Settlements
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-slate-700">
                    <th className="py-3 px-2 text-left font-semibold">Driver/Company</th>
                    <th className="py-3 px-2 text-left font-semibold">Amount</th>
                    <th className="py-3 px-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements && settlements.length > 0 ? (
                    settlements.slice(0, 5).map((s: any) => (
                      <tr
                        key={s.id}
                        className="border-b dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <td className="py-3 px-2 font-medium">
                          {s.driver ? `👨 ${s.driver.name}` : `🏢 ${s.company?.name || "Unknown"}`}
                        </td>
                        <td className="py-3 px-2 font-bold text-green-600">
                          Rs.{toNumber(s.netAmount).toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              s.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        No settlements yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-800 hover:shadow-lg transition">
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className="text-red-600" size={24} />
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Customer Blacklist
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-slate-700">
                    <th className="py-3 px-2 text-left font-semibold">Customer</th>
                    <th className="py-3 px-2 text-left font-semibold">Mobile</th>
                    <th className="py-3 px-2 text-center font-semibold">Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {blacklist && blacklist.length > 0 ? (
                    blacklist.slice(0, 5).map((b: any) => (
                      <tr
                        key={b.id}
                        className="border-b dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        <td className="py-3 px-2 font-medium">{b.customerName}</td>
                        <td className="py-3 px-2">{b.customerMobile}</td>
                        <td className="py-3 px-2 text-center">
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold text-xs">
                            {b.returnCount}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-500">
                        No blacklisted customers
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-800 hover:shadow-lg transition">
          <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-white">
            Monthly Revenue Trend
          </h3>
          <div className="h-80">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" as const },
                },
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}