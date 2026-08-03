import { motion } from "framer-motion";
import {
  CalendarDays,
  MapPin,
  Power,
  Gauge,
  Boxes,
  CheckCircle2,
  CircleDot,
  Circle,
  CircleDotDashed,
  Zap,
  User as UserIcon,
  Clock,
  Eye,
} from "lucide-react";
import type { ProgressEntry } from "@/types";
import { useMasterDataStore } from "@/store/masterDataStore";
import { StatusBadge } from "./StatusBadge";

interface ProgressEntryDetailProps {
  entry: ProgressEntry;
  showEngineerInfo?: boolean;
  showManagerInfo?: boolean;
  compact?: boolean;
  readOnly?: boolean;
}

export function ProgressEntryDetail({
  entry,
  showEngineerInfo = true,
  showManagerInfo = true,
  compact = false,
}: ProgressEntryDetailProps) {
  const { getLocationName, getLineName, getTransformerName, getTransformerById } =
    useMasterDataStore();

  const transformer = getTransformerById(entry.transformerId);

  const steps = [
    {
      key: "installed",
      label: "Installed",
      value: entry.transformersInstalled,
      icon: <Boxes className="w-4 h-4" />,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      active: entry.transformersInstalled > 0,
    },
    {
      key: "terminated",
      label: "Terminated",
      value: entry.transformersTerminated,
      icon: <CircleDot className="w-4 h-4" />,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      active: entry.transformersTerminated > 0,
    },
    {
      key: "tested",
      label: "Tested",
      value: entry.transformersTested,
      icon: <CircleDotDashed className="w-4 h-4" />,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      active: entry.transformersTested > 0,
    },
    {
      key: "commissioned",
      label: "Commissioned",
      value: entry.transformersCommissioned,
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      active: entry.transformersCommissioned > 0,
    },
  ];

  return (
    <div className={`space-y-${compact ? "3" : "5"}`}>
      {!compact && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h4 className="font-display text-lg font-bold text-slate-900">
              Progress Entry Details
            </h4>
            <StatusBadge status={entry.status} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 flex items-center gap-3"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-100 text-brand-700 shrink-0">
            <CalendarDays className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Entry Date
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {new Date(entry.entryDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 flex items-center gap-3"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
            <MapPin className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Location
            </p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {getLocationName(entry.locationId)}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 flex items-center gap-3"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 text-amber-700 shrink-0">
            <Power className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Line · {entry.voltageLevel}
            </p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {getLineName(entry.lineId)}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 flex items-center gap-3"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 text-violet-700 shrink-0">
            <Gauge className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Transformer {transformer ? `· ${transformer.capacityKVA}kVA` : ""}
            </p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {getTransformerName(entry.transformerId)}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/60 border border-brand-200/50 p-3 flex items-center gap-3 sm:col-span-2"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-600 text-white shrink-0 shadow-sm">
            <Zap className="w-4.5 h-4.5 fill-current" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              Completed Kilometers
            </p>
            <p className="font-display text-2xl font-bold text-brand-900 leading-none">
              {entry.completedKm.toFixed(3)}
              <span className="ml-1.5 text-sm font-medium text-brand-700">
                km
              </span>
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Transformer Status Pipeline
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              className={`rounded-xl border p-4 text-center transition-all ${
                step.active
                  ? `border-transparent ${step.bgColor} ${step.color}`
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${
                  step.active ? "bg-white shadow-inner" : "bg-slate-50"
                }`}
              >
                {step.icon}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1">
                {step.label}
              </p>
              <p className="font-display text-xl font-bold">{step.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {(showEngineerInfo || showManagerInfo) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {showEngineerInfo && entry.siteEngineerName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="rounded-xl bg-slate-50 border border-slate-200/60 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Site Engineer
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {entry.siteEngineerName}
              </p>
              {entry.submittedAt && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  Submitted:{" "}
                  {new Date(entry.submittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </motion.div>
          )}

          {showManagerInfo && entry.branchManagerName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-xl bg-emerald-50 border border-emerald-200/60 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                  Branch Manager
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {entry.branchManagerName}
              </p>
              {entry.publishedAt && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  Published:{" "}
                  {new Date(entry.publishedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {entry.rejectionComments && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="rounded-xl bg-rose-50 border border-rose-200/60 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <XCirclePlaceholder />
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Rejection Comments
            </p>
          </div>
          <p className="text-sm text-rose-900 leading-relaxed">
            {entry.rejectionComments}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function XCirclePlaceholder() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-rose-600"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
