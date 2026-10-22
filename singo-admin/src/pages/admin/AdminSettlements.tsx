import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { DollarSign, CheckCircle, Loader2 } from "lucide-react";

interface Settlement {
  id: number;
  driver?: { id: number; name: string };
  company?: { id: number; name: string };
  totalAmount: number;
  codTotalAmount?: number;
  deliveryCharge: number;
  codDeliveryCharge?: number;
  paidDeliveryCharge?: number;
  netAmount: number;
  status: string;
  remarks: string;
  createdAt: string;
}

export default function AdminSettlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "PENDING" | "COMPLETED">("PENDING");

  useEffect(() => {
    loadSettlements();
  }, [filter]);

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const res = await api.get("/settlements/admin/all");
      let data = res.data || [];
      if (filter !== "all") {
        data = data.filter((s: Settlement) => s.status === filter);
      }
      setSettlements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load settlements:", error);
      setSettlements([]);
    }
    setLoading(false);
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm("Approve this settlement and mark as COMPLETED?"))
      return;
    try {
      await api.patch(`/settlements/admin/${id}/approve`);
      alert("✅ Settlement approved!");
      loadSettlements();
    } catch (error: any) {
      alert(error.response?.data?.message || "Approval failed!");
    }
  };

  const pendingTotal = settlements
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + Number(s.netAmount), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            All Cash Settlements
          </h1>
          <button
            onClick={loadSettlements}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-slate-800"
            }`}
          >
            All Settlements
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === "PENDING"
                ? "bg-yellow-600 text-white"
                : "bg-gray-200 dark:bg-slate-800"
            }`}
          >
            Pending ({settlements.filter((s) => s.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("COMPLETED")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === "COMPLETED"
                ? "bg-green-600 text-white"
                : "bg-gray-200 dark:bg-slate-800"
            }`}
          >
            Completed ({settlements.filter((s) => s.status === "COMPLETED").length})
          </button>
        </div>

        {/* Pending Total Summary */}
        {filter === "PENDING" && (
          <div className="bg-yellow-50 dark:bg-slate-800 p-6 rounded-lg border-2 border-yellow-200 dark:border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                  Total Pending Amount
                </p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                  Rs.{pendingTotal.toFixed(2)}
                </p>
              </div>
              <DollarSign size={32} className="text-yellow-600 opacity-50" />
            </div>
          </div>
        )}

        {/* Settlements Table */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            Settlement Details
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : settlements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Driver/Company
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      COD Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      COD Charge
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      PAID Charge
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Net
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 text-sm font-medium">#{s.id}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {s.driver ? "👨 DRIVER" : "🏢 COMPANY"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {s.driver?.name || s.company?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">
                        Rs.{Number(s.codTotalAmount ?? s.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400">
                        Rs.{Number(s.codDeliveryCharge ?? s.deliveryCharge).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-orange-600 dark:text-orange-400">
                        Rs.{Number(s.paidDeliveryCharge || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">
                        Rs.{Number(s.netAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            s.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.remarks}</td>
                      <td className="px-4 py-3 text-sm">
                        {s.status !== "COMPLETED" && (
                          <button
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
                            onClick={() => handleApprove(s.id)}
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No settlements found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}