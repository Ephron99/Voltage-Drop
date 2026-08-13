import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileEdit,
  CalendarDays,
  MapPin,
  Power,
  Gauge,
  Zap,
  Boxes,
  CircleDot,
  CircleDotDashed,
  CheckCircle2,
  Save,
  Send,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Plus,
  Minus,
  Info,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { VoltageLevel, ProgressFormData } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { useMasterDataStore } from "@/store/masterDataStore";
import { Navbar } from "@/components/Navbar";

const navItems = [
  {
    label: "Dashboard",
    path: "/branch-manager",
    icon: <FileEdit className="w-4 h-4" />,
  },
  {
    label: "New Entry",
    path: "/branch-manager/entry",
    icon: <FileEdit className="w-4 h-4" />,
  },
  {
    label: "My History",
    path: "/branch-manager/history",
    icon: <FileEdit className="w-4 h-4" />,
  },
];

const progressSchema = z
  .object({
    entryDate: z.string().nonempty("Entry date is required"),
    locationId: z.string().nonempty("Please select a location"),
    lineId: z.string().nonempty("Please select a line"),
    voltageLevel: z.enum(["MV", "LV"]),
    transformerId: z.string().nonempty("Please select a transformer"),
    progressPct: z
      .number({ invalid_type_error: "Must be a number" })
      .min(0, "Cannot be negative")
      .max(100, "Max 100% per entry"),
    transformersInstalled: z
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be whole number")
      .min(0, "Cannot be negative")
      .max(10, "Max 10 per entry"),
    transformersTerminated: z
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be whole number")
      .min(0, "Cannot be negative")
      .max(10, "Max 10 per entry"),
    transformersTested: z
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be whole number")
      .min(0, "Cannot be negative")
      .max(10, "Max 10 per entry"),
    transformersCommissioned: z
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be whole number")
      .min(0, "Cannot be negative")
      .max(10, "Max 10 per entry"),
  })
  .refine(
    (d) =>
      d.transformersTerminated <= d.transformersInstalled ||
      d.transformersInstalled === 0,
    {
      message: "Cannot terminate more transformers than installed",
      path: ["transformersTerminated"],
    }
  )
  .refine(
    (d) => d.transformersTested <= d.transformersTerminated || d.transformersTerminated === 0,
    {
      message: "Cannot test more transformers than terminated",
      path: ["transformersTested"],
    }
  )
  .refine(
    (d) =>
      d.transformersCommissioned <= d.transformersTested ||
      d.transformersTested === 0,
    {
      message: "Cannot commission more transformers than tested",
      path: ["transformersCommissioned"],
    }
  );

type FormValues = z.infer<typeof progressSchema>;

interface Toast {
  type: "success" | "info";
  title: string;
  message?: string;
}

export default function ProgressEntryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { addEntry, updateEntry, submitEntry, getEntryById, fetchEntry } = useProgressStore();
  const {
    locations,
    hubs,
    branches,
    getBranchesByHub,
    getLinesByBranch,
    getTransformersByLine,
    getLineById,
    getBranchById,
    getHubById,
    fetchAll,
    initialized: masterInitialized,
  } = useMasterDataStore();

  useEffect(() => {
    if (!masterInitialized) {
      fetchAll();
    }
  }, [fetchAll, masterInitialized]);

  useEffect(() => {
    if (id) {
      fetchEntry(id);
    }
  }, [id, fetchEntry]);
  const [toast, setToast] = useState<Toast | null>(null);

  const editingEntry = useMemo(() => (id ? getEntryById(id) : undefined), [id, getEntryById]);

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      entryDate: todayStr,
      locationId: "",
      lineId: "",
      voltageLevel: "MV",
      transformerId: "",
      progressPct: 0,
      transformersInstalled: 0,
      transformersTerminated: 0,
      transformersTested: 0,
      transformersCommissioned: 0,
    },
  });

  useEffect(() => {
    if (editingEntry) {
      reset({
        entryDate: editingEntry.entryDate,
        locationId: editingEntry.locationId,
        lineId: editingEntry.lineId,
        voltageLevel: editingEntry.voltageLevel,
        transformerId: editingEntry.transformerId,
        progressPct: editingEntry.progressPct,
        transformersInstalled: editingEntry.transformersInstalled,
        transformersTerminated: editingEntry.transformersTerminated,
        transformersTested: editingEntry.transformersTested,
        transformersCommissioned: editingEntry.transformersCommissioned,
      });
    }
  }, [editingEntry, reset]);

  const selectedLocationId = watch("locationId");
  const selectedLineId = watch("lineId");
  const selectedVoltage = watch("voltageLevel");

  const [selectedHubId, setSelectedHubId] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  useEffect(() => {
    if (editingEntry && editingEntry.lineId && masterInitialized) {
      const line = getLineById(editingEntry.lineId);
      if (line) {
        setSelectedBranchId(line.branchId);
        const branch = getBranchById(line.branchId);
        if (branch) {
          setSelectedHubId(branch.hubId);
        }
      }
    }
  }, [editingEntry, masterInitialized, getLineById, getBranchById]);

  const availableBranches = useMemo(() => {
    return selectedHubId ? getBranchesByHub(selectedHubId) : branches;
  }, [selectedHubId, getBranchesByHub, branches]);

  const availableLines = useMemo(() => {
    const lines = selectedBranchId ? getLinesByBranch(selectedBranchId) : [];
    return lines.filter((l) => l.voltageLevel === selectedVoltage);
  }, [selectedBranchId, selectedVoltage, getLinesByBranch]);

  const availableTransformers = useMemo(() => {
    return selectedLineId ? getTransformersByLine(selectedLineId) : [];
  }, [selectedLineId, getTransformersByLine]);

  useEffect(() => {
    setSelectedBranchId("");
    setValue("lineId", "", { shouldDirty: true });
    setValue("transformerId", "", { shouldDirty: true });
  }, [selectedHubId, setValue]);

  useEffect(() => {
    setValue("lineId", "", { shouldDirty: true });
    setValue("transformerId", "", { shouldDirty: true });
  }, [selectedBranchId, selectedVoltage, setValue]);

  useEffect(() => {
    if (selectedBranchId && selectedVoltage) {
      const lines = getLinesByBranch(selectedBranchId).filter(
        (l) => l.voltageLevel === selectedVoltage
      );
      if (!lines.find((l) => l.id === selectedLineId)) {
        setValue("lineId", "", { shouldDirty: true });
        setValue("transformerId", "", { shouldDirty: true });
      }
    }
  }, [selectedVoltage, selectedBranchId, selectedLineId, getLinesByBranch, setValue]);

  useEffect(() => {
    const transformers = getTransformersByLine(selectedLineId);
    if (!transformers.find((t) => t.id === watch("transformerId"))) {
      setValue("transformerId", "", { shouldDirty: true });
    }
  }, [selectedLineId, getTransformersByLine, setValue, watch]);

  const showToast = (type: Toast["type"], title: string, message?: string) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  const onSaveDraft = async (data: FormValues) => {
    if (editingEntry) {
      if (editingEntry.status !== "draft" && editingEntry.status !== "rejected") {
        return;
      }
      const ok = await updateEntry(editingEntry.id, data as unknown as Parameters<typeof updateEntry>[1]);
      if (!ok) {
        showToast("info", "Save Failed", "Unable to save draft. Please try again.");
        return;
      }
      showToast("success", "Draft Saved", "Your progress entry has been updated.");
    } else {
      const entry = await addEntry(data as unknown as Parameters<typeof addEntry>[0], user?.id ?? "", user?.name ?? "");
      if (!entry) {
        showToast("info", "Save Failed", "Unable to save draft. Please try again.");
        return;
      }
      showToast("success", "Draft Saved", "Your progress entry has been saved as draft.");
    }
    setTimeout(() => navigate("/branch-manager/history"), 1200);
  };

  const onSubmitReview = async (data: FormValues) => {
    let entryId: string;
    if (editingEntry) {
      if (editingEntry.status !== "draft" && editingEntry.status !== "rejected") {
        return;
      }
      const ok = await updateEntry(editingEntry.id, data as unknown as Parameters<typeof updateEntry>[1]);
      if (!ok) {
        showToast("info", "Submit Failed", "Unable to update entry. Please try again.");
        return;
      }
      entryId = editingEntry.id;
    } else {
      const entry = await addEntry(data as unknown as Parameters<typeof addEntry>[0], user?.id ?? "", user?.name ?? "");
      if (!entry) {
        showToast("info", "Submit Failed", "Unable to create entry. Please try again.");
        return;
      }
      entryId = entry.id;
    }
    const submitted = await submitEntry(entryId);
    if (!submitted) {
      showToast("info", "Submit Failed", "Unable to submit for review. Please try again.");
      return;
    }
    showToast(
      "success",
      "Submitted for Review",
      "Your progress entry has been sent to Hub Manager for approval."
    );
    setTimeout(() => navigate("/branch-manager/history"), 1500);
  };

  const NumericStepper = ({
    name,
    label,
    description,
    icon,
    iconBg,
    iconColor,
  }: {
    name: keyof FormValues;
    label: string;
    description?: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
  }) => {
    const value = watch(name) as number;
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-slate-300 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconBg} ${iconColor} shadow-inner`}
            >
              {icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {label}
              </p>
              {description && (
                <p className="text-xs text-slate-500">{description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              const current = value;
              if (current > 0) setValue(name, current - 1, { shouldDirty: true });
            }}
            disabled={value <= 0}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4.5 h-4.5" />
          </button>
          <div className="flex-1 text-center">
            <p className="font-display text-3xl font-bold text-slate-900 leading-none">
              {value}
            </p>
            <input
              type="hidden"
              {...register(name, { valueAsNumber: true })}
            />
            {errors[name] && (
              <p className="text-xs text-rose-600 mt-1 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {(errors[name] as z.ZodIssue)?.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const current = value;
              setValue(name, current + 1, { shouldDirty: true });
            }}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    );
  };

  const isLocked = editingEntry && !["draft", "rejected"].includes(editingEntry.status);

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar
        role="branch_manager"
        navItems={navItems.map((item, i) => ({
          ...item,
          label: i === 0 ? "Dashboard" : i === 1 ? "New Entry" : "History",
          icon:
            i === 0 ? (
              <FileEdit className="w-4 h-4" />
            ) : i === 1 ? (
              <FileEdit className="w-4 h-4" />
            ) : (
              <FileEdit className="w-4 h-4" />
            ),
        }))}
        title="Branch Manager Portal"
      />

      <main className="container py-8 max-w-5xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-4"
        >
          <div className="flex items-center gap-3">
            <Link
              to="/branch-manager"
              className="p-2 rounded-xl text-slate-600 hover:text-brand-800 hover:bg-brand-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                {editingEntry ? "Edit Progress Entry" : "Submit Daily Progress"}
              </h1>
              <p className="text-sm text-slate-500">
                {editingEntry
                  ? "Update and resubmit the existing progress entry"
                  : "Record today's completed work across site locations and transformers"}
              </p>
            </div>
          </div>
          {editingEntry && isLocked && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800">
              <Info className="w-4 h-4" />
              <span className="text-xs font-semibold">
                Cannot edit {editingEntry.status} entries
              </span>
            </div>
          )}
        </motion.div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmitReview)}>
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-50 text-brand-700">
                <FileEdit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  General Information
                </h2>
                <p className="text-sm text-slate-500">
                  Context details for this progress entry
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    Entry Date
                  </span>
                </label>
                <input
                  type="date"
                  className="input-field"
                  max={todayStr}
                  disabled={isLocked}
                  {...register("entryDate")}
                />
                {errors.entryDate && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.entryDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5">
                    <Power className="w-3.5 h-3.5" />
                    Voltage Level (MV/LV)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
                  {(["MV", "LV"] as VoltageLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setValue("voltageLevel", lvl, { shouldDirty: true })}
                      className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        selectedVoltage === lvl
                          ? "bg-white text-brand-800 shadow-sm"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {lvl === "MV" ? "⚡ MV" : " LV"} · {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Site Location
                  </span>
                </label>
                <select
                  className="input-field"
                  disabled={isLocked}
                  {...register("locationId")}
                >
                  <option value="">— Select a site location —</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.governorate}
                    </option>
                  ))}
                </select>
                {errors.locationId && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.locationId.message}
                  </p>
                )}
              </div>

              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5" />
                    Hub
                  </span>
                </label>
                <select
                  className="input-field"
                  disabled={isLocked}
                  value={selectedHubId}
                  onChange={(e) => setSelectedHubId(e.target.value)}
                >
                  <option value="">— Select a hub —</option>
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5">
                    <CircleDot className="w-3.5 h-3.5" />
                    Branch
                  </span>
                </label>
                <select
                  className="input-field"
                  disabled={isLocked || availableBranches.length === 0}
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="">
                    {availableBranches.length === 0
                      ? selectedHubId
                        ? "No branches under this hub"
                        : "— First select a hub —"
                      : "— Select a branch —"}
                  </option>
                  {availableBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">
                  <span className="flex items-center gap-1.5">
                    <Power className="w-3.5 h-3.5" />
                    Line / Feeder
                  </span>
                </label>
                <select
                  className="input-field"
                  disabled={isLocked || availableLines.length === 0}
                  {...register("lineId")}
                >
                  <option value="">
                    {availableLines.length === 0
                      ? selectedBranchId
                        ? `No ${selectedVoltage} lines under this branch`
                        : "— First select a branch —"
                      : "— Select a line —"}
                  </option>
                  {availableLines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.name}
                    </option>
                  ))}
                </select>
                {errors.lineId && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.lineId.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="input-label">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" />
                    Transformer (TRSFO)
                  </span>
                </label>
                <select
                  className="input-field"
                  disabled={isLocked || availableTransformers.length === 0}
                  {...register("transformerId")}
                >
                  <option value="">
                    {availableTransformers.length === 0
                      ? selectedLineId
                        ? "No transformers on selected line"
                        : "— First select a line —"
                      : "— Select a transformer —"}
                  </option>
                  {availableTransformers.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name} · {tr.capacityKVA}kVA · SN:{tr.serialNumber}
                    </option>
                  ))}
                </select>
                {selectedLineId && getLineById(selectedLineId) && (
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                    <Info className="w-3 h-3 text-brand-500" />
                    <span>
                      Line: <b>{getLineById(selectedLineId)?.name}</b> (
                      {getLineById(selectedLineId)?.voltageLevel})
                      {selectedBranchId && getBranchById(selectedBranchId) && (
                        <>
                          {" · "}Branch: <b>{getBranchById(selectedBranchId)?.name}</b>
                        </>
                      )}
                      {selectedHubId && getHubById(selectedHubId) && (
                        <>
                          {" · "}Hub: <b>{getHubById(selectedHubId)?.name}</b>
                        </>
                      )}
                    </span>
                  </p>
                )}
                {errors.transformerId && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.transformerId.message}
                  </p>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border border-brand-200/50">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Progress Information
                </h2>
                <p className="text-sm text-slate-500">
                  Completed quantities for this entry — status moves left to right
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-brand-50 via-white to-brand-50 border border-brand-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700 mb-1">
                    Progress Percentage
                  </p>
                  <p className="text-xs text-slate-600">
                    Percentage of work completed today (%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="input-field !text-xl !font-display !font-bold !text-brand-900 !py-3.5 pr-14"
                    disabled={isLocked}
                    {...register("progressPct", { valueAsNumber: true })}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-brand-700">
                    %
                  </span>
                </div>
              </div>
              {errors.progressPct && (
                <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.progressPct.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <NumericStepper
                name="transformersInstalled"
                label="Installed"
                description="Physically mounted"
                icon={<Boxes className="w-5 h-5" />}
                iconBg="bg-slate-100"
                iconColor="text-slate-700"
              />
              <NumericStepper
                name="transformersTerminated"
                label="Terminated"
                description="Cable connections done"
                icon={<CircleDot className="w-5 h-5" />}
                iconBg="bg-blue-100"
                iconColor="text-blue-700"
              />
              <NumericStepper
                name="transformersTested"
                label="Tested"
                description="Electrical tests passed"
                icon={<CircleDotDashed className="w-5 h-5" />}
                iconBg="bg-amber-100"
                iconColor="text-amber-700"
              />
              <NumericStepper
                name="transformersCommissioned"
                label="Commissioned"
                description="Energized & live"
                icon={<CheckCircle2 className="w-5 h-5" />}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-700"
              />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed space-y-0.5">
                <p>
                  <span className="font-semibold">Pipeline rule:</span> Counts
                  must flow Installed → Terminated → Tested → Commissioned.
                </p>
                <p className="text-slate-500">
                  You cannot test a unit that is not yet terminated, and so on.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-2 pb-4"
          >
            <Link to="/branch-manager/history" className="btn-secondary justify-center sm:justify-start">
              <ArrowLeft className="w-4 h-4" />
              Cancel / View History
            </Link>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSubmit(onSaveDraft)}
                disabled={isLocked}
                className="btn-secondary justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4.5 h-4.5" />
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={isLocked || !isDirty}
                className="btn-primary justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4.5 h-4.5" />
                Submit for Review
              </button>
            </div>
          </motion.div>
        </form>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-50 max-w-sm"
          >
            <div
              className={`rounded-2xl shadow-xl border p-4 flex items-start gap-3 ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200/60"
                  : "bg-blue-50 border-blue-200/60"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
                  toast.type === "success"
                    ? "bg-emerald-500 text-white"
                    : "bg-blue-500 text-white"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-tight">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                    {toast.message}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
