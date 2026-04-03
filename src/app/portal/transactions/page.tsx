"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Milestone {
  id: string;
  name: string;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  position: number;
}

interface Task {
  id: string;
  title: string;
  assignedTo: string | null;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  position: number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string | null;
  createdAt: string;
}

interface Transaction {
  id: string;
  propertyAddress: string;
  propertyCity: string;
  propertyZip: string | null;
  type: string;
  status: string;
  contractPrice: number | null;
  closeDate: string | null;
  contractDate: string | null;
  otherAgentName: string | null;
  titleCompany: string | null;
  lenderName: string | null;
  notes: string | null;
  listing: { id: string; address: string; city: string; imageUrl: string | null; priceAmount: number | null } | null;
  client: { id: string; name: string | null; email: string } | null;
  agent: { id: string; name: string | null };
  milestones: Milestone[];
  tasks: Task[];
  documents: Document[];
  createdAt: string;
}

function formatPrice(n: number | null) {
  if (!n) return "—";
  return `$${n.toLocaleString()}`;
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff;
}

// Required documents per transaction type
const REQUIRED_DOCS: Record<string, { name: string; type: string; required: boolean }[]> = {
  buy: [
    { name: "Executed Contract (1-4 Family)", type: "contract", required: true },
    { name: "Third Party Financing Addendum", type: "contract", required: true },
    { name: "Buyer's Agent Representation Agreement", type: "contract", required: true },
    { name: "Seller's Disclosure Notice", type: "disclosure", required: true },
    { name: "Lead-Based Paint Disclosure", type: "disclosure", required: true },
    { name: "T-47 Affidavit (Survey)", type: "disclosure", required: false },
    { name: "Home Inspection Report", type: "inspection", required: true },
    { name: "Termite/WDI Inspection", type: "inspection", required: false },
    { name: "Appraisal Report", type: "appraisal", required: true },
    { name: "Title Commitment", type: "title", required: true },
    { name: "HOA Addendum & Resale Certificate", type: "disclosure", required: false },
    { name: "Homeowner Insurance Binder", type: "other", required: true },
    { name: "Closing Disclosure (CD)", type: "other", required: true },
    { name: "Final Walkthrough Confirmation", type: "other", required: false },
  ],
  sell: [
    { name: "Executed Contract (1-4 Family)", type: "contract", required: true },
    { name: "Listing Agreement", type: "contract", required: true },
    { name: "Seller's Disclosure Notice", type: "disclosure", required: true },
    { name: "Lead-Based Paint Disclosure", type: "disclosure", required: true },
    { name: "MLS Information Sheet", type: "other", required: true },
    { name: "T-47 Affidavit (Survey)", type: "disclosure", required: false },
    { name: "Home Inspection Report", type: "inspection", required: false },
    { name: "Repair Amendment / Negotiations", type: "amendment", required: false },
    { name: "Appraisal Report", type: "appraisal", required: false },
    { name: "Title Commitment", type: "title", required: true },
    { name: "HOA Addendum & Docs", type: "disclosure", required: false },
    { name: "Closing Disclosure (CD)", type: "other", required: true },
    { name: "Commission Disbursement Authorization", type: "other", required: true },
  ],
  dual: [
    { name: "Executed Contract (1-4 Family)", type: "contract", required: true },
    { name: "Intermediary Relationship Notice", type: "disclosure", required: true },
    { name: "Listing Agreement", type: "contract", required: true },
    { name: "Buyer's Agent Representation Agreement", type: "contract", required: true },
    { name: "Seller's Disclosure Notice", type: "disclosure", required: true },
    { name: "Lead-Based Paint Disclosure", type: "disclosure", required: true },
    { name: "Home Inspection Report", type: "inspection", required: true },
    { name: "Appraisal Report", type: "appraisal", required: true },
    { name: "Title Commitment", type: "title", required: true },
    { name: "Closing Disclosure (CD)", type: "other", required: true },
  ],
};

const ASSIGN_COLORS: Record<string, string> = {
  client: "bg-blue-50 text-blue-700",
  agent: "bg-gold/10 text-gold",
  lender: "bg-purple-50 text-purple-700",
  title: "bg-green-50 text-green-700",
  inspector: "bg-orange-50 text-orange-700",
};

export default function TransactionsPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({
    propertyAddress: "", propertyCity: "Austin", propertyZip: "",
    type: "buy", contractPrice: "", closeDate: "", contractDate: "",
    otherAgentName: "", titleCompany: "", lenderName: "",
  });

  const isAgent = (session?.user as { role?: string })?.role === "AGENT" ||
                  (session?.user as { role?: string })?.role === "ADMIN";

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    const res = await fetch("/api/portal/transactions");
    if (res.ok) {
      const data = await res.json();
      setTransactions(data.transactions || []);
      if (data.transactions?.length > 0 && !selectedTx) {
        setSelectedTx(data.transactions[0]);
      }
    }
    setLoading(false);
  }

  async function createTransaction() {
    const res = await fetch("/api/portal/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) {
      setShowNewForm(false);
      setNewForm({ propertyAddress: "", propertyCity: "Austin", propertyZip: "", type: "buy", contractPrice: "", closeDate: "", contractDate: "", otherAgentName: "", titleCompany: "", lenderName: "" });
      fetchTransactions();
    }
  }

  async function updateMilestone(milestoneId: string, status: string) {
    await fetch("/api/portal/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId, status }),
    });
    // Optimistic update
    if (selectedTx) {
      setSelectedTx({
        ...selectedTx,
        milestones: selectedTx.milestones.map((m) =>
          m.id === milestoneId ? { ...m, status, completedAt: status === "completed" ? new Date().toISOString() : null } : m
        ),
      });
    }
  }

  async function updateTask(taskId: string, status: string) {
    await fetch("/api/portal/transactions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    if (selectedTx) {
      setSelectedTx({
        ...selectedTx,
        tasks: selectedTx.tasks.map((t) =>
          t.id === taskId ? { ...t, status, completedAt: status === "completed" ? new Date().toISOString() : null } : t
        ),
      });
    }
  }

  const completedTasks = selectedTx?.tasks.filter((t) => t.status === "completed").length ?? 0;
  const totalTasks = selectedTx?.tasks.length ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const closingDays = selectedTx ? daysUntil(selectedTx.closeDate) : null;

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-navy">
            Transaction <span className="font-semibold">Tracker</span>
          </h1>
          <p className="text-mid-gray text-sm mt-1">
            Track deals from contract to close.
          </p>
        </div>
        {isAgent && (
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="bg-navy text-white px-5 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-navy/90 transition-colors"
          >
            {showNewForm ? "Cancel" : "+ New Deal"}
          </button>
        )}
      </div>

      {/* New Transaction Form */}
      {showNewForm && (
        <div className="bg-white border border-navy/10 p-6 mb-8">
          <h2 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">New Transaction</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Property Address</label>
              <input type="text" value={newForm.propertyAddress} onChange={(e) => setNewForm({ ...newForm, propertyAddress: e.target.value })} placeholder="123 Main St" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">ZIP</label>
              <input type="text" value={newForm.propertyZip} onChange={(e) => setNewForm({ ...newForm, propertyZip: e.target.value })} placeholder="78704" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Type</label>
              <select value={newForm.type} onChange={(e) => setNewForm({ ...newForm, type: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold bg-white">
                <option value="buy">Buyer Side</option>
                <option value="sell">Listing Side</option>
                <option value="dual">Dual Agent</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Contract Price</label>
              <input type="number" value={newForm.contractPrice} onChange={(e) => setNewForm({ ...newForm, contractPrice: e.target.value })} placeholder="550000" className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Contract Date</label>
              <input type="date" value={newForm.contractDate} onChange={(e) => setNewForm({ ...newForm, contractDate: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Close Date</label>
              <input type="date" value={newForm.closeDate} onChange={(e) => setNewForm({ ...newForm, closeDate: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray block mb-1">Title Company</label>
              <input type="text" value={newForm.titleCompany} onChange={(e) => setNewForm({ ...newForm, titleCompany: e.target.value })} className="w-full border border-navy/15 px-4 py-2.5 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <button onClick={createTransaction} disabled={!newForm.propertyAddress} className="bg-gold text-white px-8 py-2.5 text-sm font-semibold tracking-[0.1em] uppercase hover:bg-gold-dark transition-colors disabled:opacity-50">
            Create Transaction
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-mid-gray text-sm">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white border border-navy/10 p-16 text-center">
          <svg className="w-12 h-12 text-navy/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-navy mb-2">No Active Transactions</h3>
          <p className="text-mid-gray text-sm">
            {isAgent ? "Click '+ New Deal' to start tracking a transaction." : "Your agent will add transactions here when you go under contract."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Transaction List (sidebar) */}
          <div className="lg:w-72 flex-shrink-0 space-y-2">
            {transactions.map((tx) => {
              const isActive = selectedTx?.id === tx.id;
              const completed = tx.tasks.filter((t) => t.status === "completed").length;
              const pct = tx.tasks.length > 0 ? Math.round((completed / tx.tasks.length) * 100) : 0;

              return (
                <button
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className={`w-full text-left p-4 border transition-all ${
                    isActive ? "border-gold bg-gold/5 shadow-sm" : "border-navy/10 bg-white hover:border-navy/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 ${
                      tx.status === "under_contract" ? "bg-blue-50 text-blue-700" :
                      tx.status === "closed" ? "bg-green-50 text-green-700" :
                      tx.status === "fallen_through" ? "bg-red-50 text-red-600" :
                      "bg-navy/5 text-navy/50"
                    }`}>
                      {tx.status.replace("_", " ")}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase ${
                      tx.type === "buy" ? "text-blue-600" : tx.type === "sell" ? "text-green-600" : "text-purple-600"
                    }`}>
                      {tx.type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-navy truncate">{tx.propertyAddress}</p>
                  <p className="text-[11px] text-mid-gray">{tx.propertyCity}, TX {tx.propertyZip}</p>
                  {tx.contractPrice && (
                    <p className="text-sm font-bold text-navy mt-1">{formatPrice(tx.contractPrice)}</p>
                  )}
                  {/* Mini progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-navy/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-mid-gray">{pct}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Transaction Detail */}
          {selectedTx && (
            <div className="flex-1 space-y-6">
              {/* Header card */}
              <div className="bg-white border border-navy/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-navy">{selectedTx.propertyAddress}</h2>
                    <p className="text-mid-gray text-sm">{selectedTx.propertyCity}, TX {selectedTx.propertyZip}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-navy">{formatPrice(selectedTx.contractPrice)}</p>
                    {closingDays !== null && closingDays > 0 && (
                      <p className="text-[11px] text-gold font-semibold">{closingDays} days to close</p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-mid-gray">Progress</span>
                    <span className="text-[11px] font-semibold text-navy">{completedTasks}/{totalTasks} tasks &middot; {progress}%</span>
                  </div>
                  <div className="h-2 bg-navy/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Key dates & contacts */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {selectedTx.contractDate && (
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray">Contract</p>
                      <p className="text-navy">{new Date(selectedTx.contractDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedTx.closeDate && (
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray">Close Date</p>
                      <p className="text-navy font-semibold">{new Date(selectedTx.closeDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedTx.titleCompany && (
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray">Title</p>
                      <p className="text-navy">{selectedTx.titleCompany}</p>
                    </div>
                  )}
                  {selectedTx.lenderName && (
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-mid-gray">Lender</p>
                      <p className="text-navy">{selectedTx.lenderName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Milestone Timeline */}
              <div className="bg-white border border-navy/10 p-6">
                <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Timeline</h3>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-navy/10" />

                  <div className="space-y-4">
                    {selectedTx.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-start gap-4 relative">
                        <button
                          onClick={() => {
                            if (!isAgent) return;
                            const nextStatus = milestone.status === "completed" ? "upcoming" :
                              milestone.status === "in_progress" ? "completed" : "in_progress";
                            updateMilestone(milestone.id, nextStatus);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                            milestone.status === "completed"
                              ? "bg-gold text-white"
                              : milestone.status === "in_progress"
                                ? "bg-blue-500 text-white animate-pulse"
                                : milestone.status === "waived"
                                  ? "bg-navy/20 text-navy/40 line-through"
                                  : "bg-white border-2 border-navy/20 text-navy/30"
                          } ${isAgent ? "cursor-pointer hover:scale-110" : ""}`}
                        >
                          {milestone.status === "completed" ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          ) : milestone.status === "in_progress" ? (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          ) : (
                            <span className="text-[10px] font-bold">{milestone.position + 1}</span>
                          )}
                        </button>
                        <div className="flex-1 pb-1">
                          <p className={`text-sm font-semibold ${
                            milestone.status === "completed" ? "text-navy" :
                            milestone.status === "in_progress" ? "text-blue-600" :
                            "text-navy/40"
                          }`}>
                            {milestone.name}
                          </p>
                          {milestone.completedAt && (
                            <p className="text-[11px] text-mid-gray">
                              Completed {new Date(milestone.completedAt).toLocaleDateString()}
                            </p>
                          )}
                          {milestone.dueDate && milestone.status !== "completed" && (
                            <p className="text-[11px] text-gold">
                              Due {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Task Checklist */}
              <div className="bg-white border border-navy/10 p-6">
                <h3 className="text-sm font-semibold text-navy mb-4 tracking-wide uppercase">Tasks</h3>
                <div className="space-y-1">
                  {selectedTx.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded transition-colors ${
                        task.status === "completed" ? "bg-green-50/50" : "hover:bg-warm-gray"
                      }`}
                    >
                      <button
                        onClick={() => updateTask(task.id, task.status === "completed" ? "pending" : "completed")}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          task.status === "completed"
                            ? "border-green-500 bg-green-500"
                            : "border-navy/20 hover:border-gold"
                        }`}
                      >
                        {task.status === "completed" && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${task.status === "completed" ? "text-navy/40 line-through" : "text-navy"}`}>
                        {task.title}
                      </span>
                      {task.assignedTo && (
                        <span className={`text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded ${ASSIGN_COLORS[task.assignedTo] || "bg-navy/5 text-navy/50"}`}>
                          {task.assignedTo}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Document Checklist */}
              <ComplianceChecklist
                type={selectedTx.type}
                documents={selectedTx.documents}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ComplianceChecklist({ type, documents }: { type: string; documents: Document[] }) {
  const requiredDocs = REQUIRED_DOCS[type] || REQUIRED_DOCS.buy;
  const uploadedTypes = new Set(documents.map((d) => d.name.toLowerCase()));

  const checklist = requiredDocs.map((doc) => {
    const found = documents.find(
      (d) => d.name.toLowerCase().includes(doc.name.toLowerCase().slice(0, 15)) || d.type === doc.type
    );
    return { ...doc, uploaded: !!found, uploadedDoc: found };
  });

  const requiredCount = checklist.filter((d) => d.required).length;
  const requiredUploaded = checklist.filter((d) => d.required && d.uploaded).length;
  const missingRequired = requiredCount - requiredUploaded;

  return (
    <div className="bg-white border border-navy/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy tracking-wide uppercase">
          Compliance Checklist
        </h3>
        {missingRequired > 0 ? (
          <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5">
            {missingRequired} required missing
          </span>
        ) : (
          <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5">
            All required docs complete
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-mid-gray">{requiredUploaded}/{requiredCount} required</span>
          <span className="text-[11px] text-mid-gray">{Math.round((requiredUploaded / Math.max(requiredCount, 1)) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-navy/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${missingRequired > 0 ? "bg-red-400" : "bg-green-500"}`}
            style={{ width: `${(requiredUploaded / Math.max(requiredCount, 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-1">
        {checklist.map((doc) => (
          <div
            key={doc.name}
            className={`flex items-center gap-3 p-2.5 rounded transition-colors ${
              doc.uploaded ? "bg-green-50/50" : doc.required ? "bg-red-50/30" : ""
            }`}
          >
            {/* Status icon */}
            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
              doc.uploaded
                ? "bg-green-500"
                : doc.required
                  ? "border-2 border-red-300"
                  : "border-2 border-navy/15"
            }`}>
              {doc.uploaded && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>

            {/* Doc name */}
            <span className={`flex-1 text-sm ${
              doc.uploaded ? "text-navy/50 line-through" : "text-navy"
            }`}>
              {doc.name}
            </span>

            {/* Required badge */}
            {doc.required && !doc.uploaded && (
              <span className="text-[8px] font-bold tracking-wider uppercase text-red-500">Required</span>
            )}
            {!doc.required && !doc.uploaded && (
              <span className="text-[8px] font-bold tracking-wider uppercase text-navy/20">Optional</span>
            )}

            {/* Upload date if uploaded */}
            {doc.uploadedDoc && (
              <span className="text-[10px] text-mid-gray">
                {new Date(doc.uploadedDoc.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Uploaded docs not in checklist */}
      {documents.filter((d) => !checklist.some((c) => c.uploadedDoc?.id === d.id)).length > 0 && (
        <div className="mt-4 pt-4 border-t border-navy/10">
          <p className="text-[11px] font-semibold text-mid-gray mb-2">Other Documents</p>
          {documents
            .filter((d) => !checklist.some((c) => c.uploadedDoc?.id === d.id))
            .map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-2 text-sm text-mid-gray">
                <svg className="w-4 h-4 text-navy/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {doc.name} — {doc.type}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
