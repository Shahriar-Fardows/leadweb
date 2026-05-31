"use client";

import React, { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import {
  FiSearch,
  FiList,
  FiExternalLink,
  FiVideo,
  FiPhone,
  FiMapPin,
  FiUser,
  FiShield,
  FiRefreshCw,
} from "react-icons/fi";

interface CallLog {
  connected: boolean;
  duration: string;
  timeCalled: string;
  comment: string;
}

interface Lead {
  _id: string;
  guardianName: string;
  studentName: string;
  studentAge?: string;
  studentClass?: string;
  phone: string;
  email?: string;
  address: string;
  firstCall: string;
  secondCall: string;
  thirdCall: string;
  callLogs?: CallLog[];
  status: "New" | "Contacted" | "Qualified" | "Lost";
  webinar?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  New: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  Contacted: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  Qualified: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  Lost: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
};

export default function SharedWebinarPortal() {
  const [webinarName, setWebinarName] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const webinar = params.get("webinar");
    setWebinarName(webinar);
  }, []);

  const fetchSharedLeads = async (name: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leads/shared?webinar=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Shared leads fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (webinarName) {
      fetchSharedLeads(webinarName);
    } else if (webinarName === null && typeof window !== "undefined") {
      setIsLoading(false);
    }
  }, [webinarName]);

  const handleViewDetails = (lead: Lead) => {
    Swal.fire({
      title: `<span style="font-size:16px;font-weight:700;color:#0f172a;">Client Profile</span>`,
      html: `
        <div style="text-align: left; font-family: system-ui,sans-serif; display: flex; flex-direction: column; gap: 14px; padding-top: 8px; line-height: 1.6;">
          
          <div style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px;">
            <div style="font-weight:700; color:#3b82f6; font-size:16px; display:flex; align-items:center; gap:6px;">
              📞 ${lead.phone}
            </div>
            <span style="font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; ${
              lead.status === "New" ? "background:#dbeafe; color:#1e40af;" :
              lead.status === "Contacted" ? "background:#fef3c7; color:#92400e;" :
              lead.status === "Qualified" ? "background:#d1fae5; color:#065f46;" :
              "background:#fee2e2; color:#991b1b;"
            }">${lead.status}</span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13px;">
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
              <div style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Guardian</div>
              <div style="font-weight:700; color:#0f172a;">${lead.guardianName || "—"}</div>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
              <div style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Student</div>
              <div style="font-weight:700; color:#0f172a;">${lead.studentName || "—"}${lead.studentAge ? ` <span style="color:#64748b;font-size:11px;">(${lead.studentAge} yrs)</span>` : ""}${lead.studentClass ? ` <span style="color:#64748b;font-size:11px;">• ${lead.studentClass}</span>` : ""}</div>
            </div>
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:10px;">
              <div style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Address</div>
              <div style="font-weight:700; color:#0f172a;">${lead.address || "—"}</div>
            </div>
            ${lead.webinar ? `<div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:10px;">
              <div style="font-size:10px; font-weight:700; color:#3b82f6; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">Webinar</div>
              <div style="font-weight:700; color:#1d4ed8;">${lead.webinar}</div>
            </div>` : ""}
          </div>

          <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
            <div style="font-size:12px; font-weight:700; color:#334155; text-transform:uppercase; letter-spacing:0.05em;">Call History</div>
            ${(() => {
              const logs = lead.callLogs && lead.callLogs.length > 0
                ? lead.callLogs
                : [lead.firstCall, lead.secondCall, lead.thirdCall].filter(Boolean);
              
              if (logs.length === 0) {
                return `<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; color:#94a3b8; font-size:13px; text-align:center;">No call logs recorded for this prospect.</div>`;
              }

              return logs.map((log, index) => {
                const isNoResponse = typeof log === "string"
                  ? (log.toLowerCase().includes("no response") || log.toLowerCase().includes("did not connect"))
                  : !log.connected;
                
                const theme = isNoResponse
                  ? { border: "#fca5a5", bg: "#fff5f5", label: "#ef4444", badge: "background:#fee2e2;color:#991b1b;" }
                  : { border: "#93c5fd", bg: "#f0f9ff", label: "#3b82f6", badge: "background:#dbeafe;color:#1e40af;" };

                if (typeof log === "string") {
                  return `
                    <div style="background:${theme.bg}; border:1px solid ${theme.border}; border-radius:8px; padding:10px 12px;">
                      <div style="font-size:11px; font-weight:700; color:${theme.label}; margin-bottom:5px; display:flex; align-items:center; gap:6px;">
                        <span style="${theme.badge} padding:2px 8px; border-radius:20px; font-size:10px;">Call #${index + 1}</span>
                      </div>
                      <div style="font-size:13px; color:#334155; white-space:pre-wrap;">${log}</div>
                    </div>
                  `;
                }

                return `
                  <div style="background:${theme.bg}; border:1px solid ${theme.border}; border-radius:8px; padding:10px 12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                      <span style="${theme.badge} font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px;">
                        Call #${index + 1}: ${log.connected ? `Answered (${log.duration || "0"} min)` : "No Response"}
                      </span>
                      ${log.timeCalled ? `<span style="font-size:10px; color:#94a3b8; font-weight:600;">${log.timeCalled}</span>` : ""}
                    </div>
                    ${log.comment ? `<div style="font-size:13px; color:#334155; white-space:pre-wrap;">${log.comment}</div>` : ""}
                  </div>
                `;
              }).join("");
            })()}
          </div>
        </div>
      `,
      showCancelButton: false,
      confirmButtonText: "Close",
      background: "#ffffff",
      color: "#0f172a",
      confirmButtonColor: "#3b82f6",
      width: "640px",
    });
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        (lead.guardianName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.address || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === "New").length;
    const contactedCount = leads.filter((l) => l.status === "Contacted").length;
    const qualifiedCount = leads.filter((l) => l.status === "Qualified").length;
    const lostCount = leads.filter((l) => l.status === "Lost").length;
    return { total, newCount, contactedCount, qualifiedCount, lostCount };
  }, [leads]);

  // ── LOADING STATE ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-400 font-sans">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#3b82f6] rounded-full animate-spin" />
        <span className="text-sm font-bold">Loading webinar leads...</span>
      </div>
    );
  }

  // ── NO WEBINAR ERROR ───────────────────────────────────────────────────
  if (!webinarName) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6 gap-5 font-sans">
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-[14px] text-[#3b82f6]">
          <FiVideo className="w-10 h-10" />
        </div>
        <div className="max-w-md flex flex-col gap-2">
          <h3 className="font-bold text-slate-900 text-lg">No Webinar Specified</h3>
          <p className="text-sm text-slate-500 font-medium">
            Please access this shared dashboard with a valid webinar link. Contact the CRM administrator to get the correct sharing link.
          </p>
        </div>
      </div>
    );
  }

  // ── MAIN SHARED PORTAL ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans select-none">
      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <header className="bg-white border border-slate-200 rounded-[14px] p-5 md:p-7 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center rounded-[12px] shadow-md shadow-blue-200">
              <FiVideo className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#3b82f6] tracking-widest uppercase block mb-0.5">
                📋 Shared Lead Report
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                {webinarName}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {stats.total} total leads · Read-only public view
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchSharedLeads(webinarName)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-[8px] transition-all cursor-pointer"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-[8px] text-xs font-bold text-[#3b82f6] flex items-center gap-1.5">
              <FiShield className="w-3.5 h-3.5" />
              <span>Read-Only</span>
            </div>
          </div>
        </header>

        {/* ── STATS CARDS ────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Leads", value: stats.total, color: "text-[#3b82f6]", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "New", value: stats.newCount, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "Contacted", value: stats.contactedCount, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
            { label: "Qualified", value: stats.qualifiedCount, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { label: "Lost", value: stats.lostCount, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
          ].map((stat) => (
            <div key={stat.label} className={`bg-white border border-slate-200 p-4 rounded-[12px] shadow-sm flex flex-col gap-1 hover:shadow-md transition-shadow`}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <span className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</span>
              <div className={`w-8 h-1 rounded-full ${stat.bg} border ${stat.border} mt-1`} />
            </div>
          ))}
        </section>

        {/* ── FILTER + TABLE ──────────────────────────────────────────── */}
        <section className="bg-white border border-slate-200 rounded-[14px] shadow-sm flex flex-col overflow-hidden">

          {/* Filter Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm font-semibold bg-slate-50 border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 focus:bg-white rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[42px] text-slate-800"
              />
            </div>

            <div className="flex items-center bg-slate-100 border border-slate-200 p-1 rounded-[8px] gap-1 shrink-0">
              {[
                { key: "All", label: `All (${stats.total})` },
                { key: "New", label: `New (${stats.newCount})` },
                { key: "Contacted", label: `Contacted (${stats.contactedCount})` },
                { key: "Qualified", label: `Qualified (${stats.qualifiedCount})` },
                { key: "Lost", label: `Lost (${stats.lostCount})` },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === opt.key
                      ? "bg-white text-[#3b82f6] shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leads Table */}
          <div className="overflow-x-auto">
            {filteredLeads.length > 0 ? (
              <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-xs font-bold tracking-wider border-b border-slate-200 uppercase select-none">
                    <th className="py-3.5 px-4 w-[170px]">Guardian&apos;s Name</th>
                    <th className="py-3.5 px-4 w-[190px]">Student Details</th>
                    <th className="py-3.5 px-4 w-[160px]">Contact</th>
                    <th className="py-3.5 px-4 w-[130px]">Location</th>
                    <th className="py-3.5 px-4 w-[100px]">Status</th>
                    <th className="py-3.5 px-4 w-[190px]">1st Call Note</th>
                    <th className="py-3.5 px-4 w-[190px]">2nd Call Note</th>
                    <th className="py-3.5 px-4 w-[190px]">3rd Call Note</th>
                    <th className="py-3.5 px-4 w-[70px] text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => {
                    const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.New;
                    return (
                      <tr
                        key={lead._id}
                        className="hover:bg-slate-50/60 transition-colors text-xs font-medium"
                      >
                        <td className="py-3.5 px-4 text-slate-900 font-bold truncate">
                          {lead.guardianName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="font-bold text-slate-900 truncate" title={lead.studentName}>
                            {lead.studentName}
                          </div>
                          {(lead.studentAge || lead.studentClass) && (
                            <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                              {lead.studentAge ? `${lead.studentAge} yrs` : ""} {lead.studentClass ? `• ${lead.studentClass}` : ""}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                            {lead.phone}
                          </div>
                          {lead.email && (
                            <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-[140px]">
                              {lead.email}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 truncate">
                          {lead.address}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 truncate" title={lead.firstCall}>
                          {lead.firstCall || <span className="opacity-30 italic font-normal">No entry</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 truncate" title={lead.secondCall}>
                          {lead.secondCall || <span className="opacity-30 italic font-normal">No entry</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 truncate" title={lead.thirdCall}>
                          {lead.thirdCall || <span className="opacity-30 italic font-normal">No entry</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleViewDetails(lead)}
                            title="View Full Profile"
                            className="p-1.5 text-slate-400 hover:text-[#3b82f6] hover:bg-blue-50 rounded-[6px] transition-colors cursor-pointer"
                          >
                            <FiExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 text-slate-400 rounded-[12px]">
                  <FiList className="w-8 h-8" />
                </div>
                <div className="max-w-sm flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-slate-800">No leads match your search</h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Try clearing the search or changing the status filter.
                  </p>
                </div>
                {(searchQuery || statusFilter !== "All") && (
                  <button
                    onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
                    className="text-xs font-bold text-[#3b82f6] hover:underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Table Footer */}
          {filteredLeads.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium bg-slate-50/50">
              <span>Showing <strong className="text-slate-700">{filteredLeads.length}</strong> of <strong className="text-slate-700">{leads.length}</strong> leads</span>
              <span className="text-[10px]">🔒 Read-only · No login required</span>
            </div>
          )}
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────── */}
        <footer className="text-center text-[11px] text-slate-400 font-medium pb-4">
          This is a secure, read-only shared lead report. Data managed by Lead Space CRM. © 2026
        </footer>

      </div>
    </div>
  );
}
