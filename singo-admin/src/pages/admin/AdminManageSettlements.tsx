import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import api from "../../api/axios";
import { Loader2, Plus } from "lucide-react";

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (typeof value === 'object' && 'toNumber' in value) return value.toNumber();
  return 0;
};

export default function AdminManageSettlements() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

  useEffect(() => {
    // Load data immediately
    loadDriversData();
    loadCompaniesData();
    
    // Separate intervals - DO NOT SYNC THEM
    const driverInterval = setInterval(loadDriversData, 12000);
    const companyInterval = setInterval(loadCompaniesData, 12000);
    
    return () => {
      clearInterval(driverInterval);
      clearInterval(companyInterval);
    };
  }, []);

  const loadDriversData = async () => {
    try {
      setLoadingDrivers(true);
      const res = await api.get("/admin/settlement-drivers");
      console.log("✅ Driver Data Loaded:", res.data);

      const processedDrivers = Array.isArray(res.data)
        ? res.data.filter((d: any) => d.completedDeliveries > 0 && d.earnings > 0)
            .map((d: any) => ({
              ...d,
              earnings: toNumber(d.earnings),
              completedDeliveries: d.completedDeliveries || 0,
            }))
        : [];
      
      setDrivers(processedDrivers);
    } catch (error) {
      console.error("❌ Driver Load Error:", error);
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const loadCompaniesData = async () => {
    try {
      setLoadingCompanies(true);
      const res = await api.get("/admin/settlement-companies");
      console.log("✅ Company Data Loaded:", res.data);

      const processedCompanies = Array.isArray(res.data)
        ? res.data.filter((c: any) => c.completedDeliveries > 0)
            .map((c: any) => ({
              ...c,
              codTotalAmount: toNumber(c.codTotalAmount),
              codDeliveryCharge: toNumber(c.codDeliveryCharge),
              paidDeliveryCharge: toNumber(c.paidDeliveryCharge),
              balanceAmount: toNumber(c.balanceAmount),
              completedDeliveries: c.completedDeliveries || 0,
              codDeliveries: c.codDeliveries || 0,
              paidDeliveries: c.paidDeliveries || 0,
            }))
        : [];
      
      setCompanies(processedCompanies);
    } catch (error) {
      console.error("❌ Company Load Error:", error);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const createDriverSettlement = async (driverId: number, driverName: string) => {
    if (!window.confirm(`Create settlement for driver ${driverName}?`)) return;

    try {
      setCreatingFor(`driver-${driverId}`);
      const res = await api.post(`/admin/settlement/driver/${driverId}`);
      const settlement = res.data.settlement;
      
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
      alert(
        `✅ Settlement created for driver ${driverName}!\n\n` +
        `Gross Earnings: Rs.${toNumber(settlement.totalAmount).toFixed(2)}\n` +
        `Delivery Charge: Rs.${toNumber(settlement.deliveryCharge).toFixed(2)}\n` +
        `Net Amount: Rs.${toNumber(settlement.netAmount).toFixed(2)}`
      );
      
      loadDriversData();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Failed to create settlement - Make sure driver has completed COD deliveries"
      );
    } finally {
      setCreatingFor(null);
    }
  };

  const createCompanySettlement = async (
    companyId: number,
    companyName: string,
  ) => {
    if (!window.confirm(`Create settlement for company ${companyName}?`)) return;

    try {
      setCreatingFor(`company-${companyId}`);
      const res = await api.post(`/admin/settlement/company/${companyId}`);
      const settlement = res.data.settlement;
      
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
      alert(
        `✅ Settlement created for company ${companyName}!\n\n` +
        `COD Delivery Total: Rs.${toNumber(settlement.codTotalAmount ?? settlement.totalAmount).toFixed(2)}\n` +
        `COD Delivery Charges: Rs.${toNumber(settlement.codDeliveryCharge).toFixed(2)}\n` +
        `PAID Delivery Charges: Rs.${toNumber(settlement.paidDeliveryCharge).toFixed(2)}\n` +
        `Net Amount: Rs.${toNumber(settlement.netAmount).toFixed(2)}`
      );
      
      loadCompaniesData();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          "Failed to create settlement - Make sure company has completed unsettled deliveries"
      );
    } finally {
      setCreatingFor(null);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              Create Settlements
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Company settlements include completed COD and PAID deliveries. Delivery charges are collected from the company.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadDriversData}
              disabled={loadingDrivers}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold flex items-center gap-2"
            >
              <Loader2 size={18} className={loadingDrivers ? "animate-spin" : ""} />
              Drivers
            </button>
            <button
              onClick={loadCompaniesData}
              disabled={loadingCompanies}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold flex items-center gap-2"
            >
              <Loader2 size={18} className={loadingCompanies ? "animate-spin" : ""} />
              Companies
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DRIVERS SECTION */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              👨 Drivers Settlement
            </h2>

            {loadingDrivers && drivers.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                {drivers.length > 0 ? (
                  drivers.map((driver) => (
                    <div
                      key={driver.id}
                      className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-gray-800">{driver.name}</p>
                        <p className="text-sm text-gray-600">{driver.email}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>✅ Completed: <strong>{driver.completedDeliveries}</strong></span>
                          <span>💰 Earnings: <strong>Rs.{driver.earnings.toFixed(2)}</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => createDriverSettlement(driver.id, driver.name)}
                        disabled={
                          creatingFor === `driver-${driver.id}` ||
                          driver.completedDeliveries === 0 ||
                          driver.earnings === 0
                        }
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded font-semibold flex items-center gap-2"
                      >
                        {creatingFor === `driver-${driver.id}` ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            Create
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    No drivers with unsettled COD deliveries
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COMPANIES SECTION */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              🏢 Companies Settlement
            </h2>

            {loadingCompanies && companies.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <div
                      key={company.id}
                      className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-gray-800">{company.name}</p>
                        <p className="text-sm text-gray-600">{company.email}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>✅ COD: <strong>{company.codDeliveries}</strong> / PAID: <strong>{company.paidDeliveries}</strong></span>
                          <span>COD total: <strong>Rs.{company.codTotalAmount.toFixed(2)}</strong></span>
                          <span>COD charge: <strong>Rs.{company.codDeliveryCharge.toFixed(2)}</strong></span>
                          <span>PAID charge: <strong>Rs.{company.paidDeliveryCharge.toFixed(2)}</strong></span>
                          <span>Balance: <strong>Rs.{company.balanceAmount.toFixed(2)}</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => createCompanySettlement(company.id, company.name)}
                        disabled={
                          creatingFor === `company-${company.id}` ||
                          company.completedDeliveries === 0 ||
                          company.codTotalAmount === 0 &&
                          company.paidDeliveryCharge === 0
                        }
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded font-semibold flex items-center gap-2"
                      >
                        {creatingFor === `company-${company.id}` ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            Create
                          </>
                        )}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    No companies with unsettled completed deliveries
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800 font-bold">⚠️ IMPORTANT:</p>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>✅ Driver settlements use COMPLETED + UNSETTLED + COD deliveries</li>
            <li>✅ Company balance = COD total - COD charges - PAID charges</li>
            <li>✅ Driver and Company settlements are COMPLETELY SEPARATE</li>
            <li>✅ Deliveries are marked as settled after creation</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}