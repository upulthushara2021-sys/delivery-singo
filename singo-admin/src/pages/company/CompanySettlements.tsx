import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { Loader2 } from "lucide-react";

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
  return 0;
};

export default function CompanySettlements() {
  const [data, setData] = useState<any>({
    totalRevenue: 0,
    totalDeliverycharge: 0,
    codTotalAmount: 0,
    codDeliveryCharge: 0,
    paidDeliveryCharge: 0,
    netRevenue: 0,
    pendingAmount: 0,
    settlements: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettlements();
    const interval = setInterval(loadSettlements, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const res = await api.get("/settlements/company/me");
      console.log("Company settlements:", res.data);
      setData({
        totalRevenue: toNumber(res.data?.totalRevenue) || 0,
        totalDeliveryCharge: toNumber(res.data?.totalDeliveryCharge) || 0,
        codTotalAmount: toNumber(res.data?.codTotalAmount) || 0,
        codDeliveryCharge: toNumber(res.data?.codDeliveryCharge) || 0,
        paidDeliveryCharge: toNumber(res.data?.paidDeliveryCharge) || 0,
        netRevenue: toNumber(res.data?.netRevenue) || 0,
        pendingAmount: toNumber(res.data?.pendingAmount) || 0,
        settlements: Array.isArray(res.data?.settlements)
          ? res.data.settlements
          : [],
      });
    } catch (error) {
      console.error("Failed to load settlements:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Company Cash Settlements
          </h1>
          <button
            onClick={loadSettlements}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading && !data.settlements.length ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 dark:bg-slate-800 p-6 rounded-lg border border-blue-200 dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  COD Delivery Total
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  Rs.{toNumber(data.codTotalAmount).toFixed(2)}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-slate-800 p-6 rounded-lg border border-yellow-200 dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  COD Delivery Charges
                </p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                  Rs.{toNumber(data.codDeliveryCharge).toFixed(2)}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-slate-800 p-6 rounded-lg border border-green-200 dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  PAID Delivery Charges
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  Rs.{toNumber(data.paidDeliveryCharge).toFixed(2)}
                </p>
              </div>

              <div className="bg-red-50 dark:bg-slate-800 p-6 rounded-lg border border-red-200 dark:border-slate-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Balance Amount
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  Rs.{(toNumber(data.codTotalAmount) - toNumber(data.codDeliveryCharge) - toNumber(data.paidDeliveryCharge)).toFixed(2)}
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
                        <th className="px-4 py-3 text-left">COD Total</th>
                        <th className="px-4 py-3 text-left">COD Charge</th>
                        <th className="px-4 py-3 text-left">PAID Charge</th>
                        <th className="px-4 py-3 text-left">Balance</th>
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
                          <td className="px-4 py-3 font-bold">
                            #{settlement.id}
                          </td>
                          <td className="px-4 py-3">
                            Rs.{toNumber(settlement.codTotalAmount ?? settlement.totalAmount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            Rs.{toNumber(settlement.codDeliveryCharge ?? settlement.deliveryCharge).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-orange-600">
                            Rs.{toNumber(settlement.paidDeliveryCharge).toFixed(2)}
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
    </Layout>
  );
}