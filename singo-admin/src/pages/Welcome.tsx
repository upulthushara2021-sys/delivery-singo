import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    // 1. Added a modern mesh gradient background
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      
      {/* 2. Responsive width: w-full for mobile, max-w-md for larger screens */}
      <div className="bg-white/95 backdrop-blur-sm p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md text-center border border-white/20">
        
        {/* 3. Branding Section */}
        <div className="mb-10">
          <h1 className="text-sm font-black tracking-[0.2em] text-blue-600 uppercase mb-2">
            Delivery-Singo
          </h1>
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Welcome
          </h2>
          <div className="h-1 w-12 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <p className="text-slate-500 font-medium mb-10">
          Select your portal to get started
        </p>

        {/* 4. Interactive Buttons with transitions */}
        <div className="flex flex-col gap-4">
          <Link
            to="/company/register"
            className="group relative flex items-center justify-center bg-slate-900 text-white py-4 rounded-xl font-semibold transition-all hover:bg-slate-800 active:scale-[0.98] shadow-xl shadow-blue-900/20"
          >
            Register Company
          </Link>

          <Link
            to="/driver/register"
            className="flex items-center justify-center bg-blue-600 text-white py-4 rounded-xl font-semibold transition-all hover:bg-blue-700 active:scale-[0.98] shadow-xl shadow-blue-600/20"
          >
            Register Driver
          </Link>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Already have an account?</span></div>
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center border-2 border-slate-200 text-slate-700 py-4 rounded-xl font-semibold transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
          >
            Sign In
          </Link>
        </div>
        
        {/* 5. Footer Footer */}
        <p className="mt-10 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} SINGO Logistics Technology
        </p>
      </div>
    </div>
  );
}
