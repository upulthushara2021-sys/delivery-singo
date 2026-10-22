import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { Plus, Truck, DollarSign, Map, Printer } from "lucide-react";

interface Delivery {
  id: number;
  customerName: string;
  customerMobile: string;
  dropoffAddress: string;
  amount: number | string;
  deliveryCharge: number | string;
  paymentType: string;
  status: string;
  trackingNumber: string;
  currentBranch?: string;
  pickupBranch?: string;
  dropoffBranch?: string;
}

interface Summary {
  codTotal: number | string;
  paidTotal: number | string;
}

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
};

const formatCurrency = (value: any): string => {
  return `Rs.${toNumber(value).toFixed(2)}`;
};

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [summary, setSummary] = useState<Summary>({
    codTotal: 0,
    paidTotal: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => loadData();

    refresh();

    const handleRefresh = () => refresh();
    window.addEventListener("dashboard:refresh", handleRefresh);

    const interval = setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("dashboard:refresh", handleRefresh);
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Use correct endpoints
      const [deliveriesRes, summaryRes] = await Promise.all([
        api.get("/company/deliveries"), // ✅ GET deliveries
        api.get("/company/summary"), // ✅ GET summary
      ]);

      const deliveriesData = Array.isArray(deliveriesRes.data)
        ? deliveriesRes.data
          .filter((d: any) => d && d.id)
          .map((d: any) => ({
            ...d,
            amount: toNumber(d.amount),
            deliveryCharge: toNumber(d.deliveryCharge),
          }))
        : [];

      setDeliveries(deliveriesData);

      const summaryData = summaryRes.data || {};
      setSummary({
        codTotal: toNumber(summaryData.codTotal),
        paidTotal: toNumber(summaryData.paidTotal),
      });
    } catch (error: any) {
      console.error("Failed to load data:", error);
      setError(error.response?.data?.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "PICKED_UP":
        return "bg-purple-100 text-purple-800";
      case "BRANCH_RECEIVED":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusLabel = (delivery: Delivery): string => {
    if (delivery.status === "BRANCH_RECEIVED") {
      const branchName = delivery.currentBranch || delivery.dropoffBranch || delivery.pickupBranch;
      return branchName ? `Branch Received (${branchName})` : "Branch Received";
    }
    return delivery.status;
  };

  const printDelivery = (delivery: Delivery) => {
    const printWindow = window.open("", "_blank", "width=800,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Delivery ${delivery.trackingNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin-bottom: 4px; }
            .muted { color: #6b7280; }
            .row { display: flex; gap: 16px; padding: 9px 0; border-bottom: 1px solid #e5e7eb; }
            .label { width: 150px; font-weight: bold; }
            .value { flex: 1; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Delivery Detail</h1>
          <p class="muted">Tracking: ${delivery.trackingNumber || "N/A"}</p>
          <div class="row"><span class="label">Customer name</span><span class="value">${delivery.customerName || "N/A"}</span></div>
          <div class="row"><span class="label">Address</span><span class="value">${delivery.dropoffAddress || "N/A"}</span></div>
          <div class="row"><span class="label">Mobile</span><span class="value">${delivery.customerMobile || "N/A"}</span></div>
          <div class="row"><span class="label">Amount</span><span class="value">${formatCurrency(delivery.amount)}</span></div>
          <div class="row"><span class="label">Payment</span><span class="value">${delivery.paymentType || "N/A"}</span></div>
          <div class="row"><span class="label">Delivery charge</span><span class="value">${formatCurrency(delivery.deliveryCharge)}</span></div>
          <div class="row"><span class="label">Status</span><span class="value">${delivery.status || "N/A"}</span></div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Company Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => navigate("/company/tracking")}
              className="bg-indigo-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 font-semibold"
            >
              <Map size={20} />
              Track Deliveries
            </button>
            <button
              onClick={() => navigate("/company/create-delivery")}
              className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold"
            >
              <Plus size={20} />
              Create Delivery
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Deliveries
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {deliveries.length}
                </p>
              </div>
              <Truck size={32} className="text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-slate-900 p-6 rounded-lg shadow border-2 border-orange-200 dark:border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                  COD Total
                </p>
                <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                  {formatCurrency(summary.codTotal)}
                </p>
              </div>
              <DollarSign size={32} className="text-orange-600 opacity-50" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-slate-900 p-6 rounded-lg shadow border-2 border-green-200 dark:border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                  PAID Total
                </p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(summary.paidTotal)}
                </p>
              </div>
              <DollarSign size={32} className="text-green-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Deliveries Section */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              My Deliveries
            </h2>
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading...</p>
            </div>
          ) : deliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tracking #</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Mobile</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Dropoff</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">DeliveryCharge</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Print</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {deliveries.map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">
                        {delivery.trackingNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {delivery.customerName || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {delivery.customerMobile || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {delivery.dropoffAddress
                          ? delivery.dropoffAddress.substring(0, 20)
                          : "N/A"}
                        ...
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {formatCurrency(delivery.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {formatCurrency(delivery.deliveryCharge)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            delivery.paymentType === "COD"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {delivery.paymentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                          {getStatusLabel(delivery)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => printDelivery(delivery)}
                          title="Print delivery details"
                          className="inline-flex items-center gap-1 bg-slate-700 text-white px-2 py-1 rounded text-xs hover:bg-slate-800"
                        >
                          <Printer size={14} /> Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No deliveries yet
              </p>
              <button
                onClick={() => navigate("/company/create-delivery")}
                className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
              >
                Create your first delivery →
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}