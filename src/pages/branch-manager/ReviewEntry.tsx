import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  CheckCircle2,
  FileX2,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  User as UserIcon,
  Clock,
  Send,
  FileCheck,
  Check,
  X,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useProgressStore } from "@/store/progressStore";
import { Navbar } from "@/components/Navbar";
import { ProgressEntryDetail } from "@/components/ProgressEntryDetail";
import { StatusBadge } from "@/components/StatusBadge";

const navItems = [
  {
    label: "Dashboard",
    path: "/branch-manager",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    label: "Published",
    path: "/branch-manager/published",
    icon: <FileCheck className="w-4 h-4" />,
  },
];

const rejectSchema = z.object({
  comments: z
    .string()
    .min(15, "Please provide at least 15 characters of feedback")
    .max(500, "Max 500 characters"),
});

type RejectValues = z.infer<typeof rejectSchema>;

type ActionState = "idle" | "approving" | "publishing" | "rejecting";

export default function ReviewEntry() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const {
    getEntryById,
    approveEntry,
    publishEntry,
    rejectEntry,
  } = useProgressStore();
  const managerId = user?.id ?? "";
  const managerName = user?.name ?? "";

  const entry = id ? getEntryById(id) : undefined;

  const [actionState, setActionState] = useState<ActionState>("idle");
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset: resetReject,
    formState: { errors: rejectErrors, isSubmitting: rejectSubmitting },
  } = useForm<RejectValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { comments: "" },
  });

  const showToast = (
    type: "success" | "error",
    title: string,
    message?: string
  ) => {
    setToast({ type, title, message });
    setTimeout(() => setToast(null), 4000);
  };

  if (!entry) {
    return (
      <div className="min-h-screen bg-electric-grid">
        <Navbar
          role="branch_manager"
          navItems={navItems}
          title="Branch Manager Portal"
        />
        <main className="container py-16 max-w-md text-center space-y-4 mx-auto">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 text-slate-400 mx-auto">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Entry Not Found
          </h1>
          <p className="text-sm text-slate-500">
            The progress entry you're trying to review no longer exists or may have been deleted.
          </p>
          <Link to="/branch-manager" className="btn-primary inline-flex">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const canReview = entry.status === "submitted";
  const canPublishOnly = entry.status === "approved";

  const handleApprove = async () => {
    setActionState("approving");
    const ok = await approveEntry(entry.id, managerId, managerName);
    setActionState("idle");
    if (ok) {
      showToast(
        "success",
        "Entry Approved",
        "The entry has been approved. You can now publish it to refresh dashboards."
      );
    } else {
      showToast("error", "Approval Failed", "Unable to approve entry. Please try again.");
    }
  };

  const handlePublish = async () => {
    if (!confirmPublish) {
      setConfirmPublish(true);
      return;
    }
    setActionState("publishing");
    const ok = await publishEntry(entry.id, managerId, managerName);
    setActionState("idle");
    setConfirmPublish(false);
    if (ok) {
      showToast(
        "success",
        "Entry Published 🎉",
        "The progress entry has been published. Dashboards will now reflect this data."
      );
      setTimeout(() => navigate("/branch-manager"), 1800);
    } else {
      showToast("error", "Publish Failed", "Unable to publish entry. Please try again.");
    }
  };

  const handleRejectSubmit = async (values: RejectValues) => {
    setActionState("rejecting");
    const ok = await rejectEntry(entry.id, values.comments);
    setActionState("idle");
    setShowRejectPanel(false);
    resetReject();
    if (ok) {
      showToast(
        "success",
        "Entry Rejected",
        "Site Engineer has been notified and will revise the entry based on your comments."
      );
      setTimeout(() => navigate("/branch-manager"), 1800);
    } else {
      showToast("error", "Rejection Failed", "Unable to reject entry. Please try again.");
    }
  };

  const statusContextMessage = () => {
    if (!canReview && !canPublishOnly) {
      return {
        variant: "info" as const,
        title: "This entry is not currently under review.",
        body: `Current status: ${entry.status}. Only submitted entries can be approved.`,
      };
    }
    return null;
  };

  const ctx = statusContextMessage();

  return (
    <div className="min-h-screen bg-electric-grid">
      <Navbar
        role="branch_manager"
        navItems={navItems}
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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                  Progress Entry Review
                </h1>
                <StatusBadge status={entry.status} />
              </div>
              <p className="text-sm text-slate-500">
                Entry ID: #{entry.id.slice(-8).toUpperCase()} · Submitted for your validation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Clock className="w-3.5 h-3.5" />
            {new Date(entry.createdAt).toLocaleString("en-GB")}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 card p-6 space-y-5"
          >
            <ProgressEntryDetail entry={entry} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
          >
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200/60">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900">
                    Your Actions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validate and process this entry
                  </p>
                </div>
              </div>

              {ctx ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3.5 flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                      {ctx.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {ctx.body}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3 pt-2">
                {canReview && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={actionState !== "idle"}
                      className="btn-secondary w-full justify-center !border-blue-200 !text-blue-700 !bg-blue-50 hover:!bg-blue-100 disabled:opacity-50"
                    >
                      {actionState === "approving" ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </motion.span>
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                      Approve Entry
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={actionState !== "idle"}
                      className="btn-success w-full justify-center disabled:opacity-50"
                    >
                      {actionState === "publishing" ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Send className="w-4.5 h-4.5" />
                        </motion.span>
                      ) : confirmPublish ? (
                        <>
                          <Check className="w-4.5 h-4.5" />
                          Confirm Publish?
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4.5 h-4.5" />
                          Approve & Publish Now
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectPanel(true);
                        setConfirmPublish(false);
                      }}
                      disabled={actionState !== "idle"}
                      className="btn-danger w-full justify-center disabled:opacity-50"
                    >
                      <FileX2 className="w-4.5 h-4.5" />
                      Reject with Comments
                    </button>
                    {confirmPublish && (
                      <motion.button
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        onClick={() => setConfirmPublish(false)}
                        className="btn-ghost w-full justify-center text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <X className="w-4 h-4" />
                        Cancel publish confirmation
                      </motion.button>
                    )}
                  </>
                )}
                {canPublishOnly && (
                  <button
                    onClick={handlePublish}
                    disabled={actionState !== "idle"}
                    className="btn-success w-full justify-center disabled:opacity-50"
                  >
                    {actionState === "publishing" ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <Send className="w-4.5 h-4.5" />
                      </motion.span>
                    ) : confirmPublish ? (
                      <>Confirm Publish?</>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4.5 h-4.5" />
                        Publish to Dashboards
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {entry.siteEngineerName && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="card p-5 space-y-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Submitted By
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 border border-brand-200/60">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm leading-tight">
                      {entry.siteEngineerName}
                    </p>
                    <p className="text-xs text-slate-500">Site Engineer</p>
                  </div>
                </div>
                {entry.submittedAt && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 text-xs text-slate-600 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    Submitted{" "}
                    {new Date(entry.submittedAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-50 border border-amber-200/60 p-5 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                <p className="text-sm font-semibold text-amber-800 leading-tight">
                  Approval Checklist
                </p>
              </div>
              <ul className="text-xs text-amber-800/80 space-y-1.5 leading-relaxed pl-6.5 list-disc">
                <li>Quantities match actual site progress</li>
                <li>Transformer status pipeline is sequential</li>
                <li>Location/line/TRSFO mappings are correct</li>
                <li>Entry date matches date of on-site work</li>
                <li>Km figure reasonable for single-day work</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {showRejectPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => actionState === "idle" && setShowRejectPanel(false)}
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-x-0 bottom-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 w-full lg:max-w-lg bg-white border border-slate-200 shadow-2xl rounded-t-3xl lg:rounded-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="sticky top-0 bg-white border-b border-slate-200/60 px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 shrink-0 shadow-inner">
                    <FileX2 className="w-5.5 h-5.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-slate-900 leading-tight">
                      Reject Progress Entry
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provide clear feedback so the engineer can revise and resubmit
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => actionState === "idle" && setShowRejectPanel(false)}
                  disabled={actionState !== "idle"}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleRejectSubmit)} className="p-6 space-y-4">
                <div>
                  <label className="input-label" htmlFor="comments">
                    Rejection Comments
                  </label>
                  <textarea
                    id="comments"
                    rows={6}
                    placeholder="Describe what needs to be corrected in detail. For example: the transformer termination count seems too high for a single day, please double-check the count and provide photos as evidence."
                    className="input-field resize-none"
                    maxLength={500}
                    {...register("comments")}
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    {rejectErrors.comments && (
                      <p className="text-xs text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {rejectErrors.comments.message}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 ml-auto">
                      {watchComments?.length ?? 0}/500
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3.5 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed space-y-1">
                    <p className="font-semibold">This will:</p>
                    <ul className="list-disc space-y-0.5 pl-4">
                      <li>Send the entry back to the Site Engineer with your comments</li>
                      <li>Mark the status as <b>Rejected</b> visible to all parties</li>
                      <li>Notify the Site Engineer via their dashboard</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => actionState === "idle" && setShowRejectPanel(false)}
                    disabled={actionState !== "idle"}
                    className="btn-secondary flex-1 justify-center disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rejectSubmitting || actionState !== "idle"}
                    className="btn-danger flex-1 justify-center disabled:opacity-50"
                  >
                    {actionState === "rejecting" ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="inline-block"
                        >
                          <FileX2 className="w-4.5 h-4.5" />
                        </motion.span>
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <FileX2 className="w-4.5 h-4.5" />
                        Confirm Rejection
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                  : "bg-rose-50 border-rose-200/60"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
                  toast.type === "success"
                    ? "bg-emerald-500 text-white"
                    : "bg-rose-500 text-white"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
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

function watchComments() {
  return undefined;
}
