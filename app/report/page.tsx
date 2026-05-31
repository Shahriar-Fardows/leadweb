"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FiList, FiUserCheck, FiPhoneCall, FiActivity, FiSearch,
  FiRefreshCw, FiShield, FiVideo, FiExternalLink, FiUser,
  FiTrendingUp, FiFilter,
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
  status: "New" | "Contacted" | "Qualified" | "Lost" | "Sales";
  webinar?: string;
  createdAt: string;
}

interface Webinar {
  _id: string;
  name: string;
}

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  New:       { bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-700",   dot: "bg-blue-500" },
  Contacted: { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-500" },
  Qualified: { bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-700",dot: "bg-emerald-500" },
  Lost:      { bg: "bg-red-50",     border: "border-red-200",    text: "text-red-600",    dot: "bg-red-400" },
  Sales:     { bg: "bg-violet-50",  border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
};

export default function BossReportPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "leads">("overview");
  const [selectedWebinar, setSelectedWebinar] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewLead, setViewLead] = useState<Lead | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/report");
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
        setWebinars(data.webinars);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const src = selectedWebinar === "All" ? leads : leads.filter(l => l.webinar === selectedWebinar);
    const total = src.length;
    const newCount      = src.filter(l => l.status === "New").length;
    const contactedCount= src.filter(l => l.status === "Contacted").length;
    const qualifiedCount= src.filter(l => l.status === "Qualified").length;
    const lostCount     = src.filter(l => l.status === "Lost").length;
    const salesCount    = src.filter(l => l.status === "Sales").length;
    const followups     = src.filter(l => (l.firstCall || l.secondCall) && !l.thirdCall).length;
    const contactedPct  = total ? Math.round((contactedCount / total) * 100) : 0;
    const convRate      = qualifiedCount > 0 ? Math.round((salesCount / qualifiedCount) * 100) : 0;
    return { total, newCount, contactedCount, qualifiedCount, lostCount, salesCount, followups, contactedPct, convRate };
  }, [leads, selectedWebinar]);

  // Per-webinar breakdown
  const webinarStats = useMemo(() => {
    return webinars.map(w => {
      const wLeads = leads.filter(l => l.webinar === w.name);
      const total = wLeads.length;
      const qualified = wLeads.filter(l => l.status === "Qualified").length;
      const sales     = wLeads.filter(l => l.status === "Sales").length;
      const contacted = wLeads.filter(l => l.status === "Contacted").length;
      const lost      = wLeads.filter(l => l.status === "Lost").length;
      const conv = qualified > 0 ? Math.round((sales / qualified) * 100) : 0;
      return { name: w.name, total, qualified, sales, contacted, lost, conv };
    }).filter(w => w.total > 0).sort((a, b) => b.total - a.total);
  }, [leads, webinars]);

  // Filtered leads for table
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const byWebinar = selectedWebinar === "All" || l.webinar === selectedWebinar;
      const byStatus  = statusFilter === "All" || l.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const bySearch  = !q || [l.guardianName, l.studentName, l.phone, l.address, l.webinar]
        .some(v => (v || "").toLowerCase().includes(q));
      return byWebinar && byStatus && bySearch;
    });
  }, [leads, selectedWebinar, statusFilter, searchQuery]);

  // Top areas pie data
  const areaData = useMemo(() => {
    const src = selectedWebinar === "All" ? leads : leads.filter(l => l.webinar === selectedWebinar);
    const mp: Record<string, number> = {};
    src.forEach(l => { if (l.address && l.address !== "N/A") mp[l.address] = (mp[l.address] || 0) + 1; });
    return Object.entries(mp).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [leads, selectedWebinar]);

  // Age group data
  const ageData = useMemo(() => {
    const src = selectedWebinar === "All" ? leads : leads.filter(l => l.webinar === selectedWebinar);
    const groups: [string, string, number, number][] = [
      ["3-5", "#3b82f6", 0, 5], ["6-8", "#f59e0b", 6, 8],
      ["9-11", "#10b981", 9, 11], ["12-14", "#ef4444", 12, 14],
      ["15-17", "#8b5cf6", 15, 17], ["18+", "#06b6d4", 18, 999],
    ];
    return groups.map(([label, color, min, max]) => ({
      label, color,
      count: src.filter(l => { const a = parseInt(l.studentAge || ""); return !isNaN(a) && a >= min && a <= max; }).length
    })).filter(g => g.count > 0);
  }, [leads, selectedWebinar]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 font-sans">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#3b82f6] rounded-full animate-spin" />
        <span className="text-sm font-bold text-slate-400">Loading report...</span>
      </div>
    );
  }

  const COLORS = ["#3b82f6","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#f97316"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans select-none">
      <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-5">

        {/* ── HEADER ── */}
        <header className="bg-white border border-slate-200 rounded-[14px] p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#3b82f6] text-white flex items-center justify-center rounded-[10px] shadow shadow-blue-200 text-lg font-black">L</div>
            <div>
              <span className="text-[10px] font-bold text-[#3b82f6] tracking-widest uppercase block">Lead Space CRM</span>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Boss Report Dashboard</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Read-only · No login required · {leads.length} total leads</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold rounded-[8px] transition-all cursor-pointer">
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-[8px] text-xs font-bold text-[#3b82f6] flex items-center gap-1.5">
              <FiShield className="w-3.5 h-3.5" /><span>Read-Only</span>
            </div>
          </div>
        </header>

        {/* ── WEBINAR FILTER TABS ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["All", ...webinars.map(w => w.name)].map(name => (
            <button key={name} onClick={() => setSelectedWebinar(name)}
              className={`px-4 py-2 rounded-[8px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                selectedWebinar === name
                  ? "bg-[#3b82f6] text-white border-[#3b82f6] shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-300"
              }`}>
              {name === "All" ? "All Webinars" : name}
              <span className={`ml-1.5 text-[10px] ${selectedWebinar === name ? "text-blue-200" : "text-slate-400"}`}>
                ({name === "All" ? leads.length : leads.filter(l => l.webinar === name).length})
              </span>
            </button>
          ))}
        </div>

        {/* ── 5 STAT CARDS ── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Leads", value: stats.total, color: "text-[#3b82f6]", icon: <FiList className="w-5 h-5" />, iconBg: "bg-blue-50 text-[#3b82f6]" },
            { label: "Webinar Join", value: stats.qualifiedCount, color: "text-emerald-600", icon: <FiUserCheck className="w-5 h-5" />, iconBg: "bg-emerald-50 text-emerald-600" },
            { label: "Active Follow-ups", value: stats.followups, color: "text-amber-600", icon: <FiPhoneCall className="w-5 h-5" />, iconBg: "bg-amber-50 text-amber-500" },
            { label: "Contacted Rate", value: `${stats.contactedPct}%`, color: "text-purple-600", icon: <FiActivity className="w-5 h-5" />, iconBg: "bg-purple-50 text-purple-600" },
            { label: "Sales Converted", value: stats.salesCount, color: "text-violet-700", icon: <FiTrendingUp className="w-5 h-5" />, iconBg: "bg-violet-50 text-violet-600" },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 p-4 rounded-[12px] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-[8px] ${s.iconBg}`}>{s.icon}</div>
            </div>
          ))}
        </section>

        {/* ── TABS ── */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-[10px] w-fit">
          {[
            { key: "overview", label: "Overview & Charts" },
            { key: "leads",    label: "All Lead Records" },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`px-5 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
                activeTab === t.key ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Age Group Bar */}
              <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800">Age Group Distribution</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 mb-5">Which age group has the most students</p>
                {ageData.length === 0
                  ? <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-bold">No age data available</div>
                  : (() => {
                    const maxV = Math.max(...ageData.map(g => g.count), 1);
                    const W = 320, H = 140, PL = 28, PB = 28, PT = 8, GAP = 10;
                    const bW = Math.max(Math.floor((W - PL - GAP * (ageData.length - 1)) / ageData.length), 20);
                    return (
                      <svg viewBox={`0 0 ${W + 10} ${H + PB + PT}`} className="w-full" style={{ overflow: "visible" }}>
                        {[0, Math.ceil(maxV / 2), maxV].map((v, i) => {
                          const y = PT + H - (v / maxV) * H;
                          return <g key={i}><line x1={PL} y1={y} x2={W + 10} y2={y} stroke="#e2e8f0" strokeWidth="0.7" /><text x={PL - 4} y={y + 3.5} textAnchor="end" fontSize="6.5" fill="#94a3b8" fontWeight="700">{v}</text></g>;
                        })}
                        {ageData.map(({ label, color, count }, i) => {
                          const bH = Math.max((count / maxV) * H, 3);
                          const x = PL + i * (bW + GAP), y = PT + H - bH;
                          return <g key={label}>
                            <rect x={x} y={y} width={bW} height={bH} fill={color} rx="3" opacity="0.9" />
                            <text x={x + bW / 2} y={y - 3} textAnchor="middle" fontSize="7" fill="#334155" fontWeight="700">{count}</text>
                            <text x={x + bW / 2} y={PT + H + PB - 10} textAnchor="middle" fontSize="7" fill="#64748b" fontWeight="700">{label}</text>
                          </g>;
                        })}
                        <line x1={PL} y1={PT + H} x2={W + 10} y2={PT + H} stroke="#e2e8f0" strokeWidth="0.8" />
                      </svg>
                    );
                  })()
                }
              </div>

              {/* Top Areas Pie */}
              <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800">Top Areas</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 mb-5">Which area has the most leads</p>
                {areaData.length === 0
                  ? <div className="h-52 flex items-center justify-center text-xs text-slate-400 font-bold">No address data available</div>
                  : (() => {
                    const total = areaData.reduce((s, [, v]) => s + v, 0);
                    const CX = 80, CY = 80, R = 65, IR = 36;
                    let angle = -Math.PI / 2;
                    const segs = areaData.map(([label, count], i) => {
                      const frac = count / total;
                      const sA = angle; angle += frac * 2 * Math.PI; const eA = angle;
                      const x1 = CX + R * Math.cos(sA), y1 = CY + R * Math.sin(sA);
                      const x2 = CX + R * Math.cos(eA), y2 = CY + R * Math.sin(eA);
                      const ix1 = CX + IR * Math.cos(sA), iy1 = CY + IR * Math.sin(sA);
                      const ix2 = CX + IR * Math.cos(eA), iy2 = CY + IR * Math.sin(eA);
                      const lg = frac > 0.5 ? 1 : 0;
                      const path = `M${ix1},${iy1} L${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${ix2},${iy2} A${IR},${IR} 0 ${lg},0 ${ix1},${iy1} Z`;
                      return { path, color: COLORS[i % COLORS.length], label, count, pct: Math.round(frac * 100) };
                    });
                    return (
                      <div className="flex items-center gap-5">
                        <svg viewBox="0 0 160 160" className="w-44 h-44 shrink-0">
                          {segs.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.9" stroke="white" strokeWidth="1.5" />)}
                          <text x={CX} y={CY - 5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">{total}</text>
                          <text x={CX} y={CY + 9} textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="700">TOTAL</text>
                        </svg>
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          {segs.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: s.color }} />
                              <span className="text-[11px] font-bold text-slate-600 truncate flex-1" title={s.label}>{s.label}</span>
                              <span className="text-[11px] font-bold text-slate-400 shrink-0">{s.count} ({s.pct}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                }
              </div>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Webinar Join & Sales bar */}
              <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800">Webinar Join &amp; Sales Conversion</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 mb-5">How many joined the Webinar and how many converted to Sales</p>
                {(() => {
                  const bars = [
                    { label: "Total", sub: "Leads", val: stats.total, color: "#94a3b8" },
                    { label: "Contacted", sub: "", val: stats.contactedCount, color: "#f59e0b" },
                    { label: "Webinar", sub: "Join", val: stats.qualifiedCount, color: "#10b981" },
                    { label: "Sales", sub: "Convert", val: stats.salesCount, color: "#8b5cf6" },
                  ];
                  const maxV = Math.max(...bars.map(b => b.val), 1);
                  const W = 300, H = 110, PL = 16, PB = 32, PT = 8, GAP = 16;
                  const bW = Math.floor((W - PL - GAP * (bars.length - 1)) / bars.length);
                  return (
                    <div className="flex flex-col gap-3">
                      <svg viewBox={`0 0 ${W + PL} ${H + PB + PT}`} className="w-full" style={{ overflow: "visible" }}>
                        {[0, Math.ceil(maxV / 2), maxV].map((v, i) => {
                          const y = PT + H - (v / maxV) * H;
                          return <g key={i}><line x1={PL} y1={y} x2={W + PL} y2={y} stroke="#e2e8f0" strokeWidth="0.7" /><text x={PL - 4} y={y + 3.5} textAnchor="end" fontSize="6.5" fill="#94a3b8" fontWeight="700">{v}</text></g>;
                        })}
                        {bars.map((b, i) => {
                          const bH = Math.max((b.val / maxV) * H, b.val > 0 ? 3 : 0);
                          const x = PL + i * (bW + GAP), y = PT + H - bH;
                          return <g key={b.label}>
                            <rect x={x} y={y} width={bW} height={bH} fill={b.color} rx="4" opacity="0.9" />
                            {b.val > 0 && <text x={x + bW / 2} y={y - 3} textAnchor="middle" fontSize="7" fill="#334155" fontWeight="700">{b.val}</text>}
                            <text x={x + bW / 2} y={PT + H + PB - 16} textAnchor="middle" fontSize="6.5" fill="#64748b" fontWeight="700">{b.label}</text>
                            <text x={x + bW / 2} y={PT + H + PB - 6} textAnchor="middle" fontSize="6" fill="#94a3b8" fontWeight="700">{b.sub}</text>
                          </g>;
                        })}
                        <line x1={PL} y1={PT + H} x2={W + PL} y2={PT + H} stroke="#e2e8f0" strokeWidth="0.8" />
                      </svg>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center gap-1 p-3 bg-emerald-50 border border-emerald-100 rounded-[10px]">
                          <span className="text-xl font-bold text-emerald-700">{stats.qualifiedCount}</span>
                          <span className="text-[9px] font-bold text-emerald-600 text-center">Webinar Join</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-3 bg-violet-50 border border-violet-100 rounded-[10px]">
                          <span className="text-xl font-bold text-violet-700">{stats.salesCount}</span>
                          <span className="text-[9px] font-bold text-violet-600 text-center">Sales Convert</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 p-3 bg-amber-50 border border-amber-100 rounded-[10px]">
                          <span className="text-xl font-bold text-amber-700">{stats.convRate}%</span>
                          <span className="text-[9px] font-bold text-amber-600 text-center">Join → Sales</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Per-webinar breakdown table */}
              <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800">Per-Webinar Breakdown</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 mb-4">Lead status breakdown by each webinar campaign</p>
                {webinarStats.length === 0
                  ? <div className="py-10 text-center text-xs text-slate-400 font-bold">No webinar data yet</div>
                  : (
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
                      {webinarStats.map(w => (
                        <div key={w.name} className="border border-slate-100 rounded-[10px] p-3 hover:border-slate-200 hover:bg-slate-50 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[160px]" title={w.name}>{w.name}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-[4px]">{w.total} leads</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { label: "Contacted", val: w.contacted, color: "text-amber-700 bg-amber-50 border-amber-100" },
                              { label: "Join", val: w.qualified, color: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                              { label: "Sales", val: w.sales, color: "text-violet-700 bg-violet-50 border-violet-100" },
                              { label: "Lost", val: w.lost, color: "text-red-600 bg-red-50 border-red-100" },
                            ].map(s => (
                              <div key={s.label} className={`flex flex-col items-center p-1.5 rounded-[6px] border text-center ${s.color}`}>
                                <span className="text-sm font-bold">{s.val}</span>
                                <span className="text-[9px] font-bold">{s.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        )}

        {/* ── LEADS TABLE TAB ── */}
        {activeTab === "leads" && (
          <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm flex flex-col overflow-hidden">

            {/* Filter bar */}
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search by name, phone, address, webinar..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm font-semibold bg-slate-50 border border-slate-200 focus:border-[#3b82f6] focus:bg-white rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[42px] text-slate-800" />
              </div>
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-[8px] shrink-0 overflow-x-auto">
                {["All","New","Contacted","Qualified","Lost","Sales"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-[6px] text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      statusFilter === s ? "bg-white text-[#3b82f6] shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {filteredLeads.length > 0 ? (
                <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold tracking-wider border-b border-slate-200 uppercase">
                      <th className="py-3 px-2 w-[42px] text-center">#</th>
                      <th className="py-3 px-4 w-[140px]">Guardian</th>
                      <th className="py-3 px-4 w-[160px]">Student</th>
                      <th className="py-3 px-4 w-[150px]">Phone</th>
                      <th className="py-3 px-4 w-[120px]">Area</th>
                      <th className="py-3 px-4 w-[90px]">Status</th>
                      <th className="py-3 px-4 w-[160px]">Webinar</th>
                      <th className="py-3 px-4 w-[170px]">1st Call</th>
                      <th className="py-3 px-4 w-[170px]">2nd Call</th>
                      <th className="py-3 px-4 w-[170px]">3rd Call</th>
                      <th className="py-3 px-4 w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead, rowIdx) => {
                      const sc = STATUS_STYLE[lead.status] || STATUS_STYLE.New;
                      return (
                        <tr key={lead._id} className="hover:bg-slate-50/60 transition-colors text-xs font-medium">
                          <td className="py-3 px-2 text-center text-[10px] font-bold text-slate-300 select-none">{rowIdx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 truncate">{lead.guardianName}</td>
                          <td className="py-3 px-4 text-slate-700">
                            <div className="font-bold truncate">{lead.studentName}</div>
                            {(lead.studentAge || lead.studentClass) && (
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {lead.studentAge ? `${lead.studentAge} yrs` : ""}{lead.studentClass ? ` · ${lead.studentClass}` : ""}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">{lead.phone}</td>
                          <td className="py-3 px-4 text-slate-500 truncate">{lead.address}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{lead.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 truncate">{lead.webinar || <span className="italic text-slate-300">—</span>}</td>
                          <td className="py-3 px-4 text-slate-500 truncate" title={lead.firstCall}>{lead.firstCall || <span className="opacity-30 italic">—</span>}</td>
                          <td className="py-3 px-4 text-slate-500 truncate" title={lead.secondCall}>{lead.secondCall || <span className="opacity-30 italic">—</span>}</td>
                          <td className="py-3 px-4 text-slate-500 truncate" title={lead.thirdCall}>{lead.thirdCall || <span className="opacity-30 italic">—</span>}</td>
                          <td className="py-3 px-4">
                            <button onClick={() => setViewLead(lead)}
                              className="p-1.5 text-slate-400 hover:text-[#3b82f6] hover:bg-blue-50 rounded-[6px] transition-colors cursor-pointer">
                              <FiExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 text-slate-400 rounded-[10px]"><FiUser className="w-6 h-6" /></div>
                  <p className="text-sm font-bold text-slate-500">No leads match filters</p>
                  <button onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
                    className="text-xs font-bold text-[#3b82f6] hover:underline cursor-pointer">Reset Filters</button>
                </div>
              )}
            </div>

            {filteredLeads.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium bg-slate-50/50">
                <span>Showing <strong className="text-slate-700">{filteredLeads.length}</strong> of <strong className="text-slate-700">{leads.length}</strong> leads</span>
                <span className="text-[10px]">Read-only · No login required</span>
              </div>
            )}
          </div>
        )}

        <footer className="text-center text-[11px] text-slate-400 font-medium pb-4">
          Lead Space CRM — Boss Report Dashboard · Read-only secure view · {new Date().getFullYear()}
        </footer>
      </div>

      {/* ── LEAD DETAIL MODAL ── */}
      {viewLead && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewLead(null)}>
          <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Client Profile</h2>
              <button onClick={() => setViewLead(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">×</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {/* Status + Phone */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-[10px] p-3">
                <span className="font-bold text-slate-800 text-sm">{viewLead.phone}</span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-[6px] border ${STATUS_STYLE[viewLead.status]?.bg} ${STATUS_STYLE[viewLead.status]?.border} ${STATUS_STYLE[viewLead.status]?.text}`}>
                  {viewLead.status}
                </span>
              </div>
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Guardian", value: viewLead.guardianName },
                  { label: "Student", value: `${viewLead.studentName}${viewLead.studentAge ? ` (${viewLead.studentAge} yrs)` : ""}${viewLead.studentClass ? ` · ${viewLead.studentClass}` : ""}` },
                  { label: "Address", value: viewLead.address },
                  { label: "Webinar", value: viewLead.webinar || "—" },
                  ...(viewLead.email ? [{ label: "Email", value: viewLead.email }] : []),
                ].map(f => (
                  <div key={f.label} className="bg-slate-50 border border-slate-100 rounded-[8px] p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                    <p className="text-xs font-bold text-slate-800">{f.value}</p>
                  </div>
                ))}
              </div>
              {/* Call logs */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Call History</p>
                {[viewLead.firstCall, viewLead.secondCall, viewLead.thirdCall].filter(Boolean).length === 0
                  ? <p className="text-xs text-slate-400 italic">No call logs recorded.</p>
                  : [viewLead.firstCall, viewLead.secondCall, viewLead.thirdCall].map((log, i) =>
                      log ? (
                        <div key={i} className={`mb-2 rounded-[8px] p-3 border text-xs ${log.toLowerCase().includes("no response") || log.toLowerCase().includes("did not connect") ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                          <span className="font-bold text-slate-600 block mb-1">Call #{i + 1}</span>
                          <span className="text-slate-700 whitespace-pre-wrap">{log}</span>
                        </div>
                      ) : null
                    )
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
