import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: "blue" | "green" | "red" | "purple";
};

const colorMap = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
};

export default function StatsCard({
  title,
  value,
  icon,
  color = "blue",
}: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-800 transition"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {title}
          </p>
          <h2 className="text-3xl font-bold mt-2 text-gray-800 dark:text-white">
            {value}
          </h2>
        </div>

        <div className={`p-3 rounded-lg ${colorMap[color]}`}>{icon}</div>
      </div>
    </motion.div>
  );
}