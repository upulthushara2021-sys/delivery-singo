import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { Loader2 } from "lucide-react";

// Helper function to safely convert to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
  return 0;
};

export default function DriverSettlements() {
  const [data, setData] = useState<any>({
    pendingAmount: 0,
    totalEarnings: 0,
    settlements: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettlements();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadSettlements, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/settlements/driver/me");
      console.log("Driver settlements response:", res.data);
      
      // Ensure data has required fields
      setData({
        pendingAmount: toNumber(res.data?.pendingAmount),
        totalEarnings: toNumber(res.data?.totalEarnings),
        settlements: Array.isArray(res.data?.settlements) ? res.data.settlements : [],
      });
    } catch (error: any) {
      console.error("Failed to load settlements:", error);
      setError(error.response?.data?.message || "Failed to load settlements");
      setData({
        pendingAmount: 0,
        totalEarnings: 0,
        settlements: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCashHandover = async () => {
    if (!window.confirm(
      `Confirm: Handover Rs.${data.pendingAmount.toFixed(2)} to admin?\n\nThis will mark all pending settlements as submitted.`
    )) return;

    try {
      await api.post('/driver/cash-handover', {
        amount: data.pendingAmount,
      });
      alert('✅ Cash successfully submitted to admin!');
      loadSettlements();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit cash');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Cash Settlements
          </h1>
          <button
            onClick={loadSettlements}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading && !data.settlements.length ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-slate-800 p-6 rounded-lg border border-blue-200 dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Pending Amount
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  Rs.{data.pendingAmount.toFixed(2)}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-slate-800 p-6 rounded-lg border border-green-200 dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Completed Earnings
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  Rs.{data.totalEarnings.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Settlement History */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                Settlement History
              </h2>

              {data.settlements && data.settlements.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-left">ID</th>
                        <th className="px-4 py-3 text-left">Gross Amount</th>
                        <th className="px-4 py-3 text-left">Net Amount</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Remarks</th>
                        <th className="px-4 py-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {data.settlements.map((settlement: any) => (
                        <tr
                          key={settlement.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-800"
                        >
                          <td className="px-4 py-3 font-bold">#{settlement.id}</td>
                          <td className="px-4 py-3">
                            Rs.{toNumber(settlement.totalAmount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 font-bold text-green-600">
                            Rs.{toNumber(settlement.netAmount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                settlement.status === "COMPLETED"
                                  ? "bg-green-100 text-green-800"
                                  : settlement.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {settlement.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {settlement.remarks}
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {settlement.createdAt 
                              ? new Date(settlement.createdAt).toLocaleDateString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No settlements yet
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <div className="mt-6 bg-red-50 border-2 border-red-200 p-4 rounded-lg">
        <h3 className="font-bold text-red-700 mb-3">💰 Cash Handover to Admin</h3>
        <button
          onClick={() => handleCashHandover()}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Submit All Cash to Admin
        </button>
      </div>
    </Layout>
  );
}