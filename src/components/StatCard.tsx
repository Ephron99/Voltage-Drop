import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  trend?: { direction: "up" | "down"; value: string };
  delay?: number;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = "bg-brand-50",
  iconColor = "text-brand-700",
  trend,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="card card-hover p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-0.5">
            {title}
          </p>
          <p className="font-display text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">{subtitle}</p>
          )}
          {trend && (
            <div
              className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold ${
                trend.direction === "up" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              <span>{trend.direction === "up" ? "▲" : "▼"}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg} ${iconColor} shadow-inner shrink-0`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
