import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
  return 0;
};

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [topDrivers, setTopDrivers] = useState<any[]>([]);
  const [topCompanies, setTopCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "daily") {
      loadDailyData();
    } else {
      loadMonthlyData();
    }
  }, [activeTab, startDate, endDate, selectedYear, selectedMonth]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [summaryRes, driversRes, companiesRes] = await Promise.all([
        api.get("/analytics/summary"),
        api.get("/analytics/top-drivers?limit=5"),
        api.get("/analytics/top-companies?limit=5"),
      ]);

      setSummary(summaryRes.data);
      setTopDrivers(driversRes.data || []);
      setTopCompanies(companiesRes.data || []);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/analytics/daily", {
        params: { startDate, endDate },
      });
      setDailyData(res.data || []);
    } catch (error) {
      console.error("Failed to load daily analytics:", error);
      setDailyData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/analytics/monthly", {
        params: { year: selectedYear, month: selectedMonth },
      });
      setMonthlyData(res.data);
    } catch (error) {
      console.error("Failed to load monthly analytics:", error);
      setMonthlyData(null);
    } finally {
      setLoading(false);
    }
  };

  // Prepare Daily Chart Data
  const dailyChartData = {
    labels: dailyData.map((d) => d.date),
    datasets: [
      {
        label: "Total Revenue",
        data: dailyData.map((d) => toNumber(d.totalRevenue)),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        fill: false,
      },
      {
        label: "COD Revenue",
        data: dailyData.map((d) => toNumber(d.codRevenue)),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        tension: 0.3,
        fill: false,
      },
      {
        label: "PAID Revenue",
        data: dailyData.map((d) => toNumber(d.paidRevenue)),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.3,
        fill: false,
      },
    ],
  };

  // Prepare Daily Delivery Count Chart
  const dailyDeliveryChart = {
    labels: dailyData.map((d) => d.date),
    datasets: [
      {
        label: "Completed Deliveries",
        data: dailyData.map((d) => d.totalDeliveries),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "#3b82f6",
        borderWidth: 1,
      },
    ],
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Prepare Monthly Chart Data
  const monthlyChartData = monthlyData ? {
    labels: [`${months[selectedMonth]} ${selectedYear}`],
    datasets: [
      {
        label: "Completed Deliveries (Count)",
        data: [monthlyData.deliveries.total],
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "#3b82f6",
        borderWidth: 2,
        yAxisID: "yDeliveries",
      },
      {
        label: "Total Revenue (Rs.)",
        data: [toNumber(monthlyData.deliveries.revenue)],
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderColor: "#22c55e",
        borderWidth: 2,
        yAxisID: "yRevenue",
      },
      {
        label: "COD Revenue (Rs.)",
        data: [toNumber(monthlyData.deliveries.codRevenue)],
        backgroundColor: "rgba(249, 115, 22, 0.7)",
        borderColor: "#f97316",
        borderWidth: 2,
        yAxisID: "yRevenue",
      },
      {
        label: "PAID Revenue (Rs.)",
        data: [toNumber(monthlyData.deliveries.paidRevenue)],
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderColor: "#10b981",
        borderWidth: 2,
        yAxisID: "yRevenue",
      },
    ],
  } : null;

  const monthlyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.dataset.yAxisID === "yRevenue") {
              return `${context.dataset.label}: Rs.${toNumber(context.raw).toFixed(2)}`;
            }
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      yRevenue: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        beginAtZero: true,
        title: {
          display: true,
          text: "Revenue (Rs.)",
          color: "#22c55e",
        },
        ticks: {
          callback: (value: any) => `Rs.${value}`,
        },
      },
      yDeliveries: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        beginAtZero: true,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Completed Deliveries",
          color: "#3b82f6",
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Analytics & Reports
          </h1>
          <button
            onClick={loadAllData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-slate-800 p-6 rounded-lg border border-blue-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    Rs.{toNumber(summary.totalRevenue).toFixed(2)}
                  </p>
                </div>
                <DollarSign size={32} className="text-blue-600 opacity-50" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-slate-800 p-6 rounded-lg border border-green-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Settled Amount
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    Rs.{toNumber(summary.settledAmount).toFixed(2)}
                  </p>
                </div>
                <TrendingUp size={32} className="text-green-600 opacity-50" />
              </div>
            </div>

            <div className="bg-red-50 dark:bg-slate-800 p-6 rounded-lg border border-red-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Pending Amount
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    Rs.{toNumber(summary.pendingAmount).toFixed(2)}
                  </p>
                </div>
                <Package size={32} className="text-red-600 opacity-50" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex gap-4 border-b dark:border-slate-700">
          <button
            onClick={() => setActiveTab("daily")}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === "daily"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Daily Analytics
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-6 py-3 font-semibold border-b-2 transition ${
              activeTab === "monthly"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Monthly Analytics
          </button>
        </div>

        {/* Daily Analytics */}
        {activeTab === "daily" && (
          <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow flex gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Daily Revenue Trend
              </h3>
              {dailyData.length > 0 ? (
                <Line
                  data={dailyChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "top" },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>

            {/* Delivery Count Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                Daily Deliveries
              </h3>
              {dailyData.length > 0 ? (
                <Bar
                  data={dailyDeliveryChart}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: "top" },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <p className="text-center text-gray-500 py-8">No data available</p>
              )}
            </div>
          </div>
        )}

        {/* Monthly Analytics */}
        {activeTab === "monthly" && (
          <div className="space-y-6">
            {/* Month/Year Selector */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow flex gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                >
                  {Array.from({ length: 5 }, (_, i) =>
                    new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                >
                  {months.map((month, idx) => (
                    <option key={idx} value={idx}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly Summary */}
            {monthlyData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                    Deliveries
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Completed
                      </span>
                      <span className="font-bold text-gray-800 dark:text-white">
                        {monthlyData.deliveries.total}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Revenue
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        Rs.{toNumber(monthlyData.deliveries.revenue).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        COD Revenue
                      </span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        Rs.{toNumber(monthlyData.deliveries.codRevenue).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        PAID Revenue
                      </span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        Rs.{toNumber(monthlyData.deliveries.paidRevenue).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                    Settlements
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total Settled
                      </span>
                      <span className="font-bold text-gray-800 dark:text-white">
                        {monthlyData.settlements.total}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Net Amount
                      </span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        Rs.{toNumber(monthlyData.settlements.netAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Commission (10%)
                      </span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        Rs.{toNumber(monthlyData.settlements.commission).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Chart */}
            {monthlyChartData && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                  Monthly Overview
                </h3>
                <div className="h-80">
                  <Bar
                    data={monthlyChartData}
                    options={monthlyChartOptions}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Drivers */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <Users size={20} />
              Top Drivers
            </h3>
            {topDrivers.length > 0 ? (
              <div className="space-y-3">
                {topDrivers.map((driver, idx) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {idx + 1}. {driver.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {driver.completedDeliveries} deliveries
                      </p>
                    </div>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      ${toNumber(driver.earnings).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No data</p>
            )}
          </div>

          {/* Top Companies */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white flex items-center gap-2">
              <Package size={20} />
              Top Companies
            </h3>
            {topCompanies.length > 0 ? (
              <div className="space-y-3">
                {topCompanies.map((company, idx) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {idx + 1}. {company.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {company.completedDeliveries} deliveries
                      </p>
                    </div>
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      ${toNumber(company.revenue).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No data</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}