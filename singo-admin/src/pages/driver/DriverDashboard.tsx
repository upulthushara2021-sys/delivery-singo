import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import {
  Truck,
  CheckCircle,
  Eye,
} from "lucide-react";

interface Delivery {
  id: number;
  trackingNumber: string;
  customerName: string;
  customerMobile: string;
  dropoffAddress: string;
  amount: number | string;
  deliveryCharge: number | string;
  paymentType: string;
  status: string;
  createdAt: string;
}

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return 0;
};

const formatCurrency = (value: any): string => {
  return `Rs.${toNumber(value).toFixed(2)}`;
};

export default function DriverDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    const refresh = () => loadDeliveries();

    const timer = setTimeout(() => {
      refresh();
    }, 500);

    const handleRefresh = () => refresh();
    window.addEventListener("dashboard:refresh", handleRefresh);

    const interval = setInterval(refresh, 15000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("dashboard:refresh", handleRefresh);
    };
  }, []);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/driver/deliveries");

      const deliveriesData = Array.isArray(res.data)
        ? res.data
            .filter((d: any) => d && d.id)
            .map((d: any) => ({
              ...d,
              amount: toNumber(d.amount),
            }))
        : [];

      setDeliveries(deliveriesData);

      const total = deliveriesData.length;
      const completed = deliveriesData.filter(
        (d: Delivery) => d.status === "COMPLETED"
      ).length;
      const pending = deliveriesData.filter(
        (d: Delivery) =>
          d.status === "PENDING" ||
          d.status === "ASSIGNED" ||
          d.status === "PICKED_UP"
      ).length;

      const totalEarnings = deliveriesData
        .filter((d: Delivery) => d.status === "COMPLETED")
        .reduce((sum: number, d: Delivery) => sum + toNumber(d.amount), 0);

      setStats({ total, completed, pending, totalEarnings });
    } catch (error) {
      console.error("Failed to load deliveries:", error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/deliveries/${id}/status`, { status: newStatus });
      alert("✅ Status updated successfully!");
      loadDeliveries();
      setSelectedDelivery(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const pickupDelivery = async (id: number) => {
    try {
      await api.patch(`/deliveries/${id}/status`, { status: "PICKED_UP" });
      alert("✅ Delivery picked up successfully!");
      loadDeliveries();
      setSelectedDelivery(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to pick up delivery");
    }
  };


  const returnDelivery = async (id: number, paymentType: string) => {
    if (paymentType !== "COD") {
      alert("❌ Only COD deliveries can be returned!");
      return;
    }

    if (!window.confirm("Are you sure you want to return this delivery?"))
      return;

    try {
      await api.patch(`/deliveries/${id}/return`);
      alert("✅ Delivery marked as returned successfully!");
      loadDeliveries();
      setSelectedDelivery(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to return delivery");
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
      case "RETURNED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            My Deliveries
          </h1>
          <button
            onClick={loadDeliveries}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-slate-800 p-6 rounded-lg border border-blue-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Deliveries
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.total}
                </p>
              </div>
              <Truck size={32} className="text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-slate-800 p-6 rounded-lg border border-green-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Completed
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle size={32} className="text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-slate-800 p-6 rounded-lg border border-yellow-200 dark:border-slate-700">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.pending}
              </p>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-slate-800 p-6 rounded-lg border border-purple-200 dark:border-slate-700">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Earnings
              </p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(stats.totalEarnings)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            Assigned Deliveries
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : deliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tracking #</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Mobile</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Dropoff</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Charge</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">
                        {delivery.trackingNumber}
                      </td>
                      <td className="px-4 py-3 text-sm">{delivery.customerName}</td>
                      <td className="px-4 py-3 text-sm">{delivery.customerMobile}</td>
                      <td className="px-4 py-3 text-sm">{delivery.dropoffAddress?.substring(0, 25)}...</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {formatCurrency(delivery.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatCurrency(delivery.deliveryCharge)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            delivery.paymentType === "COD"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {delivery.paymentType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedDelivery(delivery)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No deliveries assigned</p>
          )}
        </div>

        {selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Delivery Details
            </h3>
            <div className="space-y-3">
              <p><strong>Tracking:</strong> {selectedDelivery.trackingNumber}</p>
              <p><strong>Customer:</strong> {selectedDelivery.customerName}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedDelivery.amount)}</p>
              <p><strong>Status:</strong> {selectedDelivery.status}</p>
            </div>
            <div className="mt-6 flex gap-3 flex-wrap">
              {/* PICKUP BUTTON - Show when ASSIGNED */}
              {selectedDelivery.status === "ASSIGNED" && (
                <button
                  onClick={() => pickupDelivery(selectedDelivery.id)}
                  className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 font-semibold"
                >
                  📦 Pickup
                </button>
              )}
        
              {/* COMPLETE BUTTON */}
              {selectedDelivery.status !== "COMPLETED" && selectedDelivery.status !== "RETURNED" && (
                <button
                  onClick={() => updateStatus(selectedDelivery.id, "COMPLETED")}
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold"
                >
                  ✅ Mark Completed
                </button>
              )}
        
              {/* RETURN BUTTON - Show for COD when not returned */}
              {selectedDelivery.paymentType === "COD" && selectedDelivery.status !== "RETURNED" && selectedDelivery.status !== "COMPLETED" && (
                <button
                  onClick={() => returnDelivery(selectedDelivery.id, selectedDelivery.paymentType)}
                  className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 font-semibold"
                >
                  ↩️ Return
                </button>
              )}
        
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedDelivery(null)}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}