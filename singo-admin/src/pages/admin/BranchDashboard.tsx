
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import {
  RefreshCw,
  Truck,
  Users,
  PackageCheck,
  Map,
  Plus,
} from "lucide-react";

type Delivery = {
  id: number;
  trackingNumber: string;
  customerName?: string;
  status: string;
  createdAt?: string;
};

type Driver = {
  id: number;
  name: string;
  isActive?: boolean;
};

type DeliveryResponse = {
  data: Delivery[];
  total: number;
  pages: number;
  page: number;
};

const statuses = [
  { name: "PENDING", label: "Pending" },
  { name: "ASSIGNED", label: "Assigned" },
  { name: "PICKED_UP", label: "Picked Up" },
  { name: "BRANCH_RECEIVED", label: "Received at Branch" },
  { name: "COMPLETED", label: "Completed" },
  { name: "RETURNED", label: "Returned" },
];

export default function BranchDashboard() {
  const navigate = useNavigate();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [totalDeliveries, setTotalDeliveries] = useState(0);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [firstPageResponse, driversResponse] = await Promise.all([
        api.get<DeliveryResponse>("/admin/deliveries?page=1"),
        api.get("/admin/drivers"),
      ]);

      const firstPage = firstPageResponse.data;
      const allDeliveries = [...(firstPage.data || [])];

      const totalPages = Math.max(1, Number(firstPage.pages) || 1);

      if (totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            api.get<DeliveryResponse>(
              `/admin/deliveries?page=${index + 2}`
            )
          )
        );

        remainingPages.forEach((response) => {
          allDeliveries.push(...(response.data.data || []));
        });
      }

      setDeliveries(allDeliveries);
      setTotalDeliveries(Number(firstPage.total) || allDeliveries.length);

      setDrivers(
        Array.isArray(driversResponse.data)
          ? driversResponse.data
          : []
      );
    } catch (err) {
      console.error("Branch dashboard loading failed:", err);
      setError("Unable to load branch dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const countStatus = (status: string) =>
    deliveries.filter((delivery) => delivery.status === status).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Branch Dashboard
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Overview of deliveries and drivers assigned to your branch.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Truck className="text-blue-600" size={28} />
              <p className="font-medium text-blue-700 dark:text-blue-300">
                Total Branch Deliveries
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-800 dark:text-white">
              {totalDeliveries}
            </p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Users className="text-purple-600" size={28} />
              <p className="font-medium text-purple-700 dark:text-purple-300">
                Branch Drivers
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-800 dark:text-white">
              {drivers.length}
            </p>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <PackageCheck className="text-green-600" size={28} />
              <p className="font-medium text-green-700 dark:text-green-300">
                Received at Branch
              </p>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-800 dark:text-white">
              {countStatus("BRANCH_RECEIVED")}
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
            Delivery Status Overview
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {statuses.map((status) => (
              <div
                key={status.name}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-800"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {status.label}
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {countStatus(status.name)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Recent Branch Deliveries
            </h2>

            <button
              onClick={() => navigate("/admin/dashboard/deliveries")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="px-3 py-3">Tracking Number</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...deliveries]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt || 0).getTime() -
                      new Date(a.createdAt || 0).getTime()
                  )
                  .slice(0, 10)
                  .map((delivery) => (
                    <tr
                      key={delivery.id}
                      className="border-b border-gray-100 dark:border-slate-800"
                    >
                      <td className="px-3 py-3 font-medium">
                        {delivery.trackingNumber}
                      </td>
                      <td className="px-3 py-3">
                        {delivery.customerName || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {delivery.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                {!loading && deliveries.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      No branch deliveries found.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                      Loading branch deliveries...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/admin/dashboard/create-delivery")}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Delivery
          </button>

          <button
            onClick={() => navigate("/admin/dashboard/tracking")}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            <Map size={18} />
            Track / Receive Deliveries
          </button>
        </div>
      </div>
    </Layout>
  );
}
