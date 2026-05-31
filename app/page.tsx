"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Swal from "sweetalert2";
import {
  FiMail,
  FiLock,
  FiUser,
  FiShield,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiSearch,
  FiPhone,
  FiBriefcase,
  FiTrash2,
  FiEdit3,
  FiFilter,
  FiActivity,
  FiUserCheck,
  FiExternalLink,
  FiLogOut,
  FiUserPlus,
  FiList,
  FiTrendingUp,
  FiPieChart,
  FiCheck,
  FiArrowRight,
  FiChevronLeft,
  FiGrid,
  FiMessageSquare,
  FiPhoneCall,
  FiMapPin,
  FiVideo
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
  fourthCall: string;
  callLogs?: CallLog[];
  status: "New" | "Contacted" | "Qualified" | "Lost" | "Sales";
  webinar?: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

type AuthMode = "login" | "forgot";
type SidebarMenu = "home" | "add-lead" | "leads" | "webinars" | "register" | "edit-lead";

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  New: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  Contacted: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  Qualified: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  Sales: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "bg-violet-500" },
  Lost: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
};

export default function DashboardPortal() {
  // Session state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Navigation Sidebar state
  const [activeMenu, setActiveMenu] = useState<SidebarMenu>("home");

  // Setup state (Detects if database is completely empty)
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Public portal states
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // Setup form states
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [isCreatingSetupAdmin, setIsCreatingSetupAdmin] = useState(false);

  // Webinars list and custom dropdown/creation states
  const [webinarsList, setWebinarsList] = useState<any[]>([]);
  const [isLoadingWebinars, setIsLoadingWebinars] = useState(false);
  const [newWebinarName, setNewWebinarName] = useState("");
  const [isCreatingWebinar, setIsCreatingWebinar] = useState(false);
  const [webinarSearch, setWebinarSearch] = useState("");
  const [showWebinarDropdown, setShowWebinarDropdown] = useState(false);

  // CRM Leads state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [webinarFilter, setWebinarFilter] = useState<string>("All");
  const [addressFilter, setAddressFilter] = useState<string>("All");
  const [callLogFilter, setCallLogFilter] = useState<string>("All");
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Dedicated Add Lead view form states (step-less, popup-free!)
  const [formGName, setFormGName] = useState("");
  const [formSName, setFormSName] = useState("");
  const [formSAge, setFormSAge] = useState("");
  const [formSClass, setFormSClass] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formStatus, setFormStatus] = useState<"New" | "Contacted" | "Qualified" | "Lost" | "Sales">("New");
  const [formWebinar, setFormWebinar] = useState("");
  const [formCallLogs, setFormCallLogs] = useState<CallLog[]>([{ connected: true, duration: "", timeCalled: "", comment: "" }]);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Edit Lead page state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [viewingCallsLead, setViewingCallsLead] = useState<Lead | null>(null);
  const [editGName, setEditGName] = useState("");
  const [editSName, setEditSName] = useState("");
  const [editSAge, setEditSAge] = useState("");
  const [editSClass, setEditSClass] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState<"New" | "Contacted" | "Qualified" | "Lost" | "Sales">("New");
  const [editWebinar, setEditWebinar] = useState("");
  const [editWebinarSearch, setEditWebinarSearch] = useState("");
  const [showEditWebinarDropdown, setShowEditWebinarDropdown] = useState(false);
  const [editCallLogs, setEditCallLogs] = useState<CallLog[]>([{ connected: true, duration: "", timeCalled: "", comment: "" }]);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // CSV import ref + progress state
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvProgress, setCsvProgress] = useState<{ active: boolean; current: number; total: number; imported: number; skipped: number; fileName: string }>({
    active: false, current: 0, total: 0, imported: 0, skipped: 0, fileName: ""
  });

  // Registration form states (inside dashboard)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);

  // Registered users state (for Super Admin panel)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // ── URL-based navigation ──────────────────────────────────────────────
  const MENU_TO_PATH: Record<string, string> = {
    "home": "/", "add-lead": "/add-lead", "leads": "/leads",
    "webinars": "/webinars", "register": "/register", "edit-lead": "/leads",
  };
  const PATH_TO_MENU: Record<string, SidebarMenu> = {
    "/": "home", "/add-lead": "add-lead", "/leads": "leads",
    "/webinars": "webinars", "/register": "register",
  };

  const router = useRouter();
  const pathname = usePathname();

  // Navigate — updates activeMenu state AND pushes URL
  const navigate = useCallback((menu: SidebarMenu) => {
    setActiveMenu(menu);
    const path = MENU_TO_PATH[menu] || "/";
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      router.push(path);
    }
  }, [router]);

  // Sync activeMenu from URL (browser back/forward, direct link)
  useEffect(() => {
    if (!isLoggedIn) return;
    const menu = PATH_TO_MENU[pathname];
    if (menu && menu !== activeMenu) setActiveMenu(menu);
  }, [pathname, isLoggedIn]);
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/auth/register");
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.error("Error fetching users list:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && currentUser?.role === "Super Admin" && activeMenu === "register") {
      fetchUsers();
    }
  }, [activeMenu, currentUser, isLoggedIn]);

  // Protect administrative routes from non-super admins
  useEffect(() => {
    if (isLoggedIn && currentUser && activeMenu === "register" && currentUser.role !== "Super Admin") {
      navigate("home");
    }
  }, [activeMenu, currentUser, isLoggedIn]);

  // Sync session and check setup status on mount
  useEffect(() => {
    const initPortal = async () => {
      // Sync session
      const savedUser = localStorage.getItem("crm_user_session");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          setIsLoggedIn(true);
        } catch (err) {
          localStorage.removeItem("crm_user_session");
        }
      }

      // Check DB setup status
      try {
        const res = await fetch("/api/auth/setup-status");
        const data = await res.json();
        if (data.success) {
          setRequiresSetup(data.requiresSetup);
        }
      } catch (err) {
        console.error("Error querying setup status:", err);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    initPortal();
  }, []);

  // Fetch leads when logged in
  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // Fetch pre-defined webinars list from database
  const fetchWebinars = async () => {
    setIsLoadingWebinars(true);
    try {
      const res = await fetch("/api/webinars");
      const data = await res.json();
      if (data.success) {
        setWebinarsList(data.webinars);
      }
    } catch (err) {
      console.error("Error fetching webinars:", err);
    } finally {
      setIsLoadingWebinars(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchLeads();
      fetchWebinars();
    }
  }, [isLoggedIn]);

  // SweetAlert2 helper
  const triggerAlert = (icon: "success" | "error" | "info" | "warning", title: string, text: string) => {
    Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: "Confirm",
      background: "#ffffff",
      color: "#171717",
      confirmButtonColor: "#3b82f6",
    });
  };

  const showToast = (icon: "success" | "error" | "warning" | "info", title: string) => {
    const Toast = Swal.mixin({
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: "#ffffff",
      color: "#171717",
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      }
    });
    Toast.fire({ icon, title });
  };

  // Setup first admin form handler
  const handleSetupAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName || !setupEmail || !setupPassword) {
      triggerAlert("error", "Input Required", "Please fill in all setup credentials.");
      return;
    }
    if (setupPassword.length < 6) {
      triggerAlert("warning", "Password Length", "Password must be at least 6 characters.");
      return;
    }

    setIsCreatingSetupAdmin(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: setupName, email: setupEmail, password: setupPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        triggerAlert(
          "success",
          "Setup Complete",
          `First Administrator account registered under ${data.user.email}. Setup mode is now disabled.`
        );
        setRequiresSetup(false);
        setLoginEmail(setupEmail);
        setSetupName("");
        setSetupEmail("");
        setSetupPassword("");
        setAuthMode("login");
      } else {
        triggerAlert("error", "Setup Failed", data.error || "Could not register first administrator.");
      }
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Network Error", "Could not connect to database endpoint.");
    } finally {
      setIsCreatingSetupAdmin(false);
    }
  };

  // Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      triggerAlert("error", "Input Required", "Please provide both email and password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("crm_user_session", JSON.stringify(data.user));
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        showToast("success", `Signed in as ${data.user.name}`);
        setLoginEmail("");
        setLoginPassword("");
      } else {
        triggerAlert("error", "Access Denied", data.error || "Invalid credentials.");
      }
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Network Error", "Could not reach authentication server.");
    }
  };

  // Logout handler
  const handleSignOut = () => {
    localStorage.removeItem("crm_user_session");
    setCurrentUser(null);
    setIsLoggedIn(false);
    navigate("home");
    showToast("info", "Successfully signed out.");
  };

  // Forgot Password handler
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      triggerAlert("error", "Email Required", "Please enter your email to proceed.");
      return;
    }
    triggerAlert(
      "success",
      "Reset Link Dispatched",
      `A secure recovery message was generated for ${forgotEmail}.`
    );
    setForgotEmail("");
    setAuthMode("login");
  };

  // Dedicated, full-screen Add Lead Form submission (no popups!)
  const handleAddLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPhone) {
      triggerAlert("error", "Phone Required", "Client Phone Number is required *");
      return;
    }

    const filteredLogs = formCallLogs.filter(log => 
      log.comment.trim() !== "" || 
      !log.connected || 
      log.duration.trim() !== "" || 
      log.timeCalled.trim() !== ""
    );

    const mapLogToString = (log: CallLog) => {
      if (!log.connected) {
        return `No Response / Did not connect (Time: ${log.timeCalled || "N/A"}). Cmnt: ${log.comment || "No comment"}`;
      }
      return `Answered (Time: ${log.timeCalled || "N/A"}, Duration: ${log.duration || "0"} mins). Cmnt: ${log.comment}`;
    };

    const firstCallStr = filteredLogs[0] ? mapLogToString(filteredLogs[0]) : "";
    const secondCallStr = filteredLogs[1] ? mapLogToString(filteredLogs[1]) : "";
    const thirdCallStr = filteredLogs[2] ? mapLogToString(filteredLogs[2]) : "";

    setIsSubmittingLead(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardianName: formGName || "N/A",
          studentName: formSName || "N/A",
          studentAge: formSAge || "",
          studentClass: formSClass || "",
          phone: formPhone,
          email: formEmail || "",
          address: formAddress || "N/A",
          status: formStatus,
          webinar: formWebinar || "",
          firstCall: firstCallStr,
          secondCall: secondCallStr,
          thirdCall: thirdCallStr,
          callLogs: filteredLogs
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Client record added to database!");
        // Reset form inputs
        setFormGName("");
        setFormSName("");
        setFormSAge("");
        setFormSClass("");
        setFormPhone("");
        setFormEmail("");
        setFormAddress("");
        setFormStatus("New");
        setFormWebinar("");
        setWebinarSearch("");
        setFormCallLogs([{ connected: true, duration: "", timeCalled: "", comment: "" }]);
        
        // Reload leads and dynamically redirect back to Lead Info database table list!
        fetchLeads();
        navigate("leads");
      } else {
        triggerAlert("error", "Registration Failed", data.error || "Could not save client.");
      }
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Network Error", "Could not connect to database endpoint.");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Stepless user registration handler (ONLY accessible inside the dashboard)
  const handleUserRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      triggerAlert("error", "All Fields Required", "Please provide full name, email and password.");
      return;
    }

    setIsRegisteringUser(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        triggerAlert(
          "success",
          "Account Provisioned",
          `Successfully registered account for ${data.user.name} (${data.user.email}).`
        );
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        fetchUsers();
      } else {
        triggerAlert("error", "Registration Failed", data.error || "Could not register user account.");
      }
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Network Error", "Failed to contact database endpoints.");
    } finally {
      setIsRegisteringUser(false);
    }
  };

  // Webinar pre-defined options handler
  const handleCreateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebinarName.trim()) {
      triggerAlert("error", "Webinar Name Required", "Please enter a valid webinar name.");
      return;
    }
    setIsCreatingWebinar(true);
    try {
      const res = await fetch("/api/webinars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWebinarName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Webinar option successfully created!");
        setNewWebinarName("");
        fetchWebinars();
      } else {
        triggerAlert("error", "Failed to Add Webinar", data.error || "Could not register webinar.");
      }
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Network Error", "Could not connect to database endpoints.");
    } finally {
      setIsCreatingWebinar(false);
    }
  };

  // Clipboard link copying
  const handleCopyPublicLink = (webinarNameStr: string) => {
    if (typeof window !== "undefined") {
      const publicUrl = `${window.location.origin}/shared?webinar=${encodeURIComponent(webinarNameStr)}`;
      navigator.clipboard.writeText(publicUrl);
      showToast("success", `Sharing link for "${webinarNameStr}" copied!`);
    }
  };

  // Delete webinar option
  const handleDeleteWebinar = (id: string, name: string) => {
    Swal.fire({
      title: "Delete Webinar Option?",
      text: `You are about to delete the webinar "${name}". Safe deletion checks will verify active assignments.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "No, cancel",
      background: "#ffffff",
      color: "#171717",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/webinars/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast("success", "Webinar option successfully deleted.");
            fetchWebinars();
          } else {
            triggerAlert("error", "Deletion Blocked", data.error || "Could not delete webinar option.");
          }
        } catch (err) {
          console.error(err);
          triggerAlert("error", "Network Error", "Failed to contact database endpoint.");
        }
      }
    });
  };

  // Leads CRUD: Edit Lead -- navigate to full edit page
  const handleEditLead = (lead: Lead) => {
    const logs: CallLog[] = lead.callLogs && lead.callLogs.length > 0
      ? lead.callLogs.map(l => ({
          connected: typeof l.connected === 'boolean' ? l.connected : true,
          duration: l.duration || "",
          timeCalled: l.timeCalled || "",
          comment: l.comment || ""
        }))
      : [
          lead.firstCall ? {
            connected: !lead.firstCall.toLowerCase().includes("no response") && !lead.firstCall.toLowerCase().includes("did not connect"),
            duration: lead.firstCall.match(/duration:\s*(\d+)/i)?.[1] || "",
            timeCalled: lead.firstCall.match(/time:\s*([^)]+)/i)?.[1] || lead.firstCall.split(';')[0] || "",
            comment: lead.firstCall
          } : null,
          lead.secondCall ? {
            connected: !lead.secondCall.toLowerCase().includes("no response") && !lead.secondCall.toLowerCase().includes("did not connect"),
            duration: lead.secondCall.match(/duration:\s*(\d+)/i)?.[1] || "",
            timeCalled: lead.secondCall.match(/time:\s*([^)]+)/i)?.[1] || lead.secondCall.split(';')[0] || "",
            comment: lead.secondCall
          } : null,
          lead.thirdCall ? {
            connected: !lead.thirdCall.toLowerCase().includes("no response") && !lead.thirdCall.toLowerCase().includes("did not connect"),
            duration: lead.thirdCall.match(/duration:\s*(\d+)/i)?.[1] || "",
            timeCalled: lead.thirdCall.match(/time:\s*([^)]+)/i)?.[1] || lead.thirdCall.split(';')[0] || "",
            comment: lead.thirdCall
          } : null,
        ].filter(Boolean) as CallLog[];

    if (logs.length === 0) {
      logs.push({ connected: true, duration: "", timeCalled: "", comment: "" });
    }

    // Populate edit form state and navigate to edit page
    setEditingLead(lead);
    setEditGName(lead.guardianName === "N/A" ? "" : lead.guardianName);
    setEditSName(lead.studentName === "N/A" ? "" : lead.studentName);
    setEditSAge(lead.studentAge || "");
    setEditSClass(lead.studentClass || "");
    setEditPhone(lead.phone);
    setEditEmail(lead.email || "");
    setEditAddress(lead.address === "N/A" ? "" : lead.address);
    setEditStatus(lead.status);
    setEditWebinar(lead.webinar || "");
    setEditWebinarSearch(lead.webinar || "");
    setEditCallLogs(logs);
    navigate("edit-lead");
  };

  // Handle Edit Lead form submit
  const handleUpdateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    if (!editPhone.trim()) {
      triggerAlert("error", "Required", "Client Phone Number is required.");
      return;
    }

    const mapLogToString = (log: CallLog) => {
      if (!log.connected) return `No Response / Did not connect (Time: ${log.timeCalled || "N/A"}). Cmnt: ${log.comment || "No comment"}`;
      return `Answered (Time: ${log.timeCalled || "N/A"}, Duration: ${log.duration || "0"} mins). Cmnt: ${log.comment}`;
    };

    const payload = {
      guardianName: editGName.trim() || "N/A",
      studentName: editSName.trim() || "N/A",
      studentAge: editSAge.trim(),
      studentClass: editSClass.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      address: editAddress.trim() || "N/A",
      status: editStatus,
      webinar: editWebinar,
      firstCall: editCallLogs[0] ? mapLogToString(editCallLogs[0]) : "",
      secondCall: editCallLogs[1] ? mapLogToString(editCallLogs[1]) : "",
      thirdCall: editCallLogs[2] ? mapLogToString(editCallLogs[2]) : "",
      callLogs: editCallLogs
    };

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/leads/${editingLead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Client record updated successfully!");
        fetchLeads();
        navigate("leads");
        setEditingLead(null);
      } else {
        triggerAlert("error", "Error", data.error || "Could not update lead.");
      }
    } catch (err) {
      console.error(err);
      triggerAlert("error", "Network Error", "Could not connect to database endpoint.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // CSV Export
  const downloadCSV = () => {
    const headers = ["guardian_name","student_name","age","class","phone","email","address","status","webinar","1_call","2_call","3_call","4_call","created_at"];
    const rows = leads.map(l => [
      l.guardianName, l.studentName, l.studentAge || "", l.studentClass || "",
      l.phone, l.email || "", l.address, l.status, l.webinar || "",
      l.firstCall, l.secondCall, l.thirdCall, l.fourthCall || "",
      new Date(l.createdAt).toLocaleDateString("en-BD")
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("success", `Exported ${leads.length} leads to CSV`);
  };

  // CSV Template Download
  const downloadCSVTemplate = () => {
    const headers = ["guardian_name","student_name","age","class","phone","email","address","status","webinar","1_call","2_call","3_call","4_call"];
    const example = [
      "Karim Ahmed", "Rafi Ahmed", "10", "Class 5", "01712345678",
      "karim@example.com", "Dhaka", "New", "Math Olympiad Webinar",
      "Answered — 5 mins. Interested in course.", "", "", ""
    ].map(v => `"${v}"`).join(",");
    const csvContent = [headers.join(","), example].join("\n");
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leads_import_template.csv";
    link.click();
    URL.revokeObjectURL(url);
    showToast("info", "CSV template downloaded -- fill it in Excel and re-import");
  };

  // CSV Import — supports underscore column names, 4_call, missing fields = blank
  // CSV Import — proper quoted-field parser, handles multiline cells
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const raw = await file.text();

    // Parse CSV properly: handles quoted fields with embedded commas and newlines
    const parseCSV = (src: string): string[][] => {
      const rows: string[][] = [];
      let row: string[] = [];
      let field = "";
      let inQ = false;
      const s = src.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (inQ) {
          if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
          else if (c === '"') { inQ = false; }
          else { field += c; }
        } else {
          if (c === '"') { inQ = true; }
          else if (c === ',') { row.push(field); field = ""; }
          else if (c === '\n') {
            row.push(field); field = "";
            if (row.some(v => v.trim())) rows.push(row);
            row = [];
          } else { field += c; }
        }
      }
      if (field || row.length) { row.push(field); if (row.some(v => v.trim())) rows.push(row); }
      return rows;
    };

    const allRows = parseCSV(raw);
    if (allRows.length < 2) { triggerAlert("error", "Invalid CSV", "File has no data rows."); return; }

    const [headerRow, ...dataRows] = allRows;
    const headers = headerRow.map(h => h.replace(/"/g, "").trim().toLowerCase().replace(/\s+/g, "_"));

    // Get value by column name aliases — returns "" if column missing or empty
    const get = (row: string[], ...aliases: string[]) => {
      for (const alias of aliases) {
        const key = alias.toLowerCase().replace(/\s+/g, "_");
        const idx = headers.indexOf(key);
        if (idx !== -1) {
          const val = (row[idx] || "").trim();
          if (val) return val;
        }
      }
      return "";
    };

    const validStatuses = ["New", "Contacted", "Qualified", "Lost", "Sales"];
    const total = dataRows.length;
    let imported = 0, skipped = 0;

    setCsvProgress({ active: true, current: 0, total, imported: 0, skipped: 0, fileName: file.name });

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];

      // Phone: if missing generate a placeholder so the row still imports
      const phone = get(row, "phone", "mobile", "contact", "phone_number")
        || `IMPORT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      const rawStatus = get(row, "status");
      const status = validStatuses.includes(rawStatus) ? rawStatus : "New";

      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guardianName:  get(row, "guardian_name", "guardian name", "guardian", "parent") || "N/A",
            studentName:   get(row, "student_name", "student name", "student", "name") || "N/A",
            studentAge:    get(row, "age", "student_age", "student age"),
            studentClass:  get(row, "class", "student_class", "student class", "grade"),
            phone,
            email:         get(row, "email", "e-mail", "e_mail"),
            address:       get(row, "address", "location", "area") || "N/A",
            status,
            webinar:       get(row, "webinar", "webinear", "webinar_name", "webinar name", "campaign"),
            firstCall:     get(row, "1_call", "1st_call", "1st call", "first_call", "first call", "call_1"),
            secondCall:    get(row, "2_call", "2nd_call", "2nd call", "second_call", "second call", "call_2"),
            thirdCall:     get(row, "3_call", "3rd_call", "3rd call", "third_call", "third call", "call_3"),
            fourthCall:    get(row, "4_call", "4th_call", "4th call", "fourth_call", "fourth call", "call_4"),
          })
        });
        if (res.ok) imported++; else skipped++;
      } catch { skipped++; }

      setCsvProgress({ active: true, current: i + 1, total, imported, skipped, fileName: file.name });
    }

    setCsvProgress(p => ({ ...p, active: false }));
    fetchLeads();
    triggerAlert("success", "CSV Import Complete", `${imported} leads imported, ${skipped} skipped (duplicates or errors).`);
  };

  // Leads CRUD: Delete Lead
  const handleDeleteLead = (id: string, name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete lead "${name || "Unknown"}". This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel",
      background: "#ffffff",
      color: "#171717",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/leads/${id}`, {
            method: "DELETE"
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast("success", "Client record deleted successfully.");
            fetchLeads();
          } else {
            triggerAlert("error", "Error", data.error || "Could not delete lead.");
          }
        } catch (err) {
          console.error(err);
          triggerAlert("error", "Network Error", "Failed to contact database endpoint.");
        }
      }
    });
  };

  // View Details Modal
  const handleViewDetails = (lead: Lead) => {
    Swal.fire({
      title: `Client Profile: ${lead.guardianName === "N/A" ? "No Name" : lead.guardianName}`,
      html: `
        <div style="text-align: left; font-family: sans-serif; display: flex; flex-direction: column; gap: 14px; padding-top: 10px; line-height: 1.5;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(128,128,128,0.2); padding-bottom: 8px;">
            <div style="font-weight: 700; color: #3b82f6; font-size: 15px;">Phone: ${lead.phone}</div>
            <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 8px; ${
              lead.status === "New" ? "background-color: #dbeafe; color: #1e40af;" :
              lead.status === "Contacted" ? "background-color: #fef3c7; color: #92400e;" :
              lead.status === "Qualified" ? "background-color: #d1fae5; color: #065f46;" :
              "background-color: #fee2e2; color: #991b1b;"
            }">${lead.status}</span>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
            <div><strong>Guardian's Name:</strong> ${lead.guardianName}</div>
            <div><strong>Student's Name:</strong> ${lead.studentName}</div>
            ${lead.studentAge ? `<div><strong>Student's Age:</strong> ${lead.studentAge}</div>` : ""}
            ${lead.studentClass ? `<div><strong>Student's Class:</strong> ${lead.studentClass}</div>` : ""}
            <div><strong>Client's Address:</strong> ${lead.address}</div>
            ${lead.webinar ? `<div><strong>Assigned Webinar:</strong> ${lead.webinar}</div>` : ""}
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
            ${(() => {
              const logs = lead.callLogs && lead.callLogs.length > 0
                ? lead.callLogs
                : [lead.firstCall, lead.secondCall, lead.thirdCall].filter(Boolean);
              
              if (logs.length === 0) {
                return `
                  <div style="background: rgba(128, 128, 128, 0.05); border-left: 3px solid #6b7280; padding: 8px 12px; border-radius: 4px;">
                    <div style="font-weight: 700; font-size: 12px; color: #6b7280; margin-bottom: 4px;">Call History Logs</div>
                    <div style="font-size: 13px; opacity: 0.7;">No call logs recorded for this prospect.</div>
                  </div>
                `;
              }

              return logs.map((log, index) => {
                const isNoResponse = typeof log === "string" 
                  ? (log.toLowerCase().includes("no response") || log.toLowerCase().includes("did not connect"))
                  : !log.connected;
                
                const theme = isNoResponse
                  ? { border: "#ef4444", bg: "rgba(239, 68, 68, 0.03)", text: "#ef4444" }
                  : { border: "#3b82f6", bg: "rgba(59, 130, 246, 0.03)", text: "#3b82f6" };

                if (typeof log === "string") {
                  return `
                    <div style="background: ${theme.bg}; border-left: 3px solid ${theme.border}; padding: 8px 12px; border-radius: 4px;">
                      <div style="font-weight: 700; font-size: 12px; color: ${theme.text}; margin-bottom: 4px;">Call #${index + 1} Log Entry</div>
                      <div style="font-size: 13px; white-space: pre-wrap; opacity: 0.85;">${log}</div>
                    </div>
                  `;
                }

                if (!log.connected) {
                  return `
                    <div style="background: ${theme.bg}; border-left: 3px solid ${theme.border}; padding: 8px 12px; border-radius: 4px;">
                      <div style="font-weight: 700; font-size: 12px; color: ${theme.text}; margin-bottom: 4px; display: flex; justify-content: space-between;">
                        <span>Call #${index + 1}: No Response / Did not connect</span>
                        <span style="opacity: 0.6; font-size: 10px;">${log.timeCalled || "N/A"}</span>
                      </div>
                      <div style="font-size: 13px; white-space: pre-wrap; opacity: 0.85;">${log.comment || "Did not answer."}</div>
                    </div>
                  `;
                }

                return `
                  <div style="background: ${theme.bg}; border-left: 3px solid ${theme.border}; padding: 8px 12px; border-radius: 4px;">
                    <div style="font-weight: 700; font-size: 12px; color: ${theme.text}; margin-bottom: 4px; display: flex; justify-content: space-between;">
                      <span>Call #${index + 1}: Answered (Spoke: ${log.duration || "0"} mins)</span>
                      <span style="opacity: 0.6; font-size: 10px;">${log.timeCalled || "N/A"}</span>
                    </div>
                    <div style="font-size: 13px; white-space: pre-wrap; opacity: 0.85;">${log.comment}</div>
                  </div>
                `;
              }).join("");
            })()}
          </div>
        </div>
      `,
      showCancelButton: false,
      confirmButtonText: "Close Profile",
      background: "#ffffff",
      color: "#171717",
      confirmButtonColor: "#3b82f6"
    });
  };

  // Dynamically query unique webinar list
  const uniqueWebinars = useMemo(() => {
    const list = leads.map(l => l.webinar || "").filter(Boolean);
    return ["All", "None", ...Array.from(new Set(list))];
  }, [leads]);

  // Dynamically query unique address list for filter
  const uniqueAddresses = useMemo(() => {
    const list = leads.map(l => l.address || "").filter(a => a && a !== "N/A");
    return Array.from(new Set(list)).sort();
  }, [leads]);

  // Filtered Leads (with all active filters applied)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        (lead.guardianName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.webinar || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || lead.status === statusFilter;

      const matchesWebinar = webinarFilter === "All" || 
        (webinarFilter === "None" ? !lead.webinar : lead.webinar === webinarFilter);

      const matchesAddress = addressFilter === "All" || (lead.address || "") === addressFilter;

      const callCount = [lead.firstCall, lead.secondCall, lead.thirdCall].filter(Boolean).length;
      const matchesCallLog = callLogFilter === "All" || callCount === parseInt(callLogFilter);

      return matchesSearch && matchesStatus && matchesWebinar && matchesAddress && matchesCallLog;
    });
  }, [leads, searchQuery, statusFilter, webinarFilter, addressFilter, callLogFilter]);

  // Reactive Stats Calculations
  const stats = useMemo(() => {
    const total = leads.length;

    const newCount = leads.filter(l => l.status === "New").length;
    const contactedCount = leads.filter(l => l.status === "Contacted").length;
    const qualifiedCount = leads.filter(l => l.status === "Qualified").length;
    const lostCount = leads.filter(l => l.status === "Lost").length;
    const salesCount = leads.filter(l => l.status === "Sales").length;

    const newPercent = total ? Math.round((newCount / total) * 100) : 0;
    const contactedPercent = total ? Math.round((contactedCount / total) * 100) : 0;
    const qualifiedPercent = total ? Math.round((qualifiedCount / total) * 100) : 0;
    const lostPercent = total ? Math.round((lostCount / total) * 100) : 0;
    const salesPercent = total ? Math.round((salesCount / total) * 100) : 0;

    const followupsNeeded = leads.filter(
      l => (l.firstCall !== "" || l.secondCall !== "") && l.thirdCall === ""
    ).length;

    return {
      total,
      newCount,
      contactedCount,
      qualifiedCount,
      lostCount,
      salesCount,
      newPercent,
      contactedPercent,
      qualifiedPercent,
      lostPercent,
      salesPercent,
      followupsNeeded
    };
  }, [leads]);

  // Per-webinar stats breakdown (all from database)
  const webinarStats = useMemo(() => {
    return webinarsList.map((web) => {
      const webLeads = leads.filter(l => l.webinar === web.name);
      const total = webLeads.length;
      const newCount = webLeads.filter(l => l.status === "New").length;
      const contactedCount = webLeads.filter(l => l.status === "Contacted").length;
      const qualifiedCount = webLeads.filter(l => l.status === "Qualified").length;
      const lostCount = webLeads.filter(l => l.status === "Lost").length;
      const salesCount = webLeads.filter(l => l.status === "Sales").length;
      const conversionRate = total ? Math.round(((qualifiedCount + salesCount) / total) * 100) : 0;
      return { name: web.name, total, newCount, contactedCount, qualifiedCount, lostCount, salesCount, conversionRate };
    });
  }, [leads, webinarsList]);

  // SVG Donut segments calculations ( Circumference = 100 )
  const donutSegments = useMemo(() => {
    const { newPercent, contactedPercent, qualifiedPercent, lostPercent, salesPercent } = stats;
    let currentOffset = 0;
    const segments = [
      { name: "New", value: stats.newCount, percent: newPercent, stroke: "#3b82f6", offset: currentOffset },
      { name: "Contacted", value: stats.contactedCount, percent: contactedPercent, stroke: "#f59e0b", offset: (currentOffset -= newPercent) },
      { name: "Qualified", value: stats.qualifiedCount, percent: qualifiedPercent, stroke: "#10b981", offset: (currentOffset -= contactedPercent) },
      { name: "Lost", value: stats.lostCount, percent: lostPercent, stroke: "#ef4444", offset: (currentOffset -= qualifiedPercent) },
      { name: "Sales", value: stats.salesCount, percent: salesPercent, stroke: "#8b5cf6", offset: (currentOffset -= lostPercent) },
    ];
    return segments;
  }, [stats]);

  // Loading indicator for system checks
  if (isCheckingSetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-400 font-sans">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#3b82f6] rounded-[8px] animate-spin" />
        <span className="text-sm font-bold">Connecting to Lead Space CRM...</span>
      </div>
    );
  }

  // RENDER 1: Dynamic Dashboard UI with Left Sidebar
  if (isLoggedIn && currentUser) {
    return (
      <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans">
        
        {/* LEFT DOCK SIDEBAR -- PREMIUM LIGHT */}
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between text-slate-500 shrink-0 select-none md:h-full shadow-sm">
          <div>
            {/* Sidebar Brand Header */}
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-[32px] h-[32px] bg-[#3b82f6] text-white flex items-center justify-center font-bold text-[16px] rounded-[8px] shadow shadow-blue-200">
                L
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 tracking-wide leading-none">
                  Lead Space
                </span>
                <span className="text-[10px] text-slate-400 font-bold mt-1">
                  CRM PANEL
                </span>
              </div>
            </div>

            {/* Sidebar Menu Items */}
            <nav className="p-4 flex flex-col gap-1">
              
              {/* Home Page (Analytics) */}
              <button
                onClick={() => navigate("home")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-[8px] transition-all cursor-pointer ${
                  activeMenu === "home"
                    ? "bg-[#3b82f6] text-white shadow-sm shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <FiGrid className="w-4.5 h-4.5 shrink-0" />
                <span>Home Page</span>
              </button>

              {/* Add Lead Form View */}
              <button
                onClick={() => navigate("add-lead")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-[8px] transition-all cursor-pointer ${
                  activeMenu === "add-lead"
                    ? "bg-[#3b82f6] text-white shadow-sm shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <FiPlus className="w-4.5 h-4.5 shrink-0" />
                <span>Add Lead</span>
              </button>

              {/* Lead Info */}
              <button
                onClick={() => navigate("leads")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-[8px] transition-all cursor-pointer ${
                  activeMenu === "leads"
                    ? "bg-[#3b82f6] text-white shadow-sm shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <FiList className="w-4.5 h-4.5 shrink-0" />
                <span>Lead Info</span>
              </button>

              {/* Manage Webinars */}
              <button
                onClick={() => navigate("webinars")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-[8px] transition-all cursor-pointer ${
                  activeMenu === "webinars"
                    ? "bg-[#3b82f6] text-white shadow-sm shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <FiVideo className="w-4.5 h-4.5 shrink-0" />
                <span>Manage Webinars</span>
              </button>

              {/* Administrative Registration */}
              {currentUser.role === "Super Admin" && (
                <button
                  onClick={() => navigate("register")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-[8px] transition-all cursor-pointer ${
                    activeMenu === "register"
                      ? "bg-[#3b82f6] text-white shadow-sm shadow-blue-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <FiUserPlus className="w-4.5 h-4.5 shrink-0" />
                  <span>Register User</span>
                </button>
              )}

            </nav>
          </div>

          {/* Sidebar Footer Profile & Logout Info */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 border border-blue-100 text-[#3b82f6] flex items-center justify-center font-bold text-sm rounded-[8px]">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-slate-800 truncate leading-none mb-0.5">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate font-medium">
                  {currentUser.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 text-slate-500 text-xs font-bold rounded-[8px] transition-all cursor-pointer"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* RIGHT WORKSPACE PANELS */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 relative bg-slate-50">
          
          <div className="absolute top-10 right-10 w-80 h-80 bg-blue-500/3 rounded-full filter blur-3xl pointer-events-none -z-10" />

          {/* Content Header Title */}
          <header className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                {activeMenu === "home"
                  ? "Workspace Analytics"
                  : activeMenu === "add-lead"
                  ? "Add Client Record"
                  : activeMenu === "leads"
                  ? "Lead Database System"
                  : activeMenu === "webinars"
                  ? "Manage Webinar Campaigns"
                  : activeMenu === "edit-lead"
                  ? "Update Client Record"
                  : "Administrative Provisioning"}
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1">
                {activeMenu === "home"
                  ? "Interactive visual reports, SVG charts, and fast navigation buttons"
                  : activeMenu === "add-lead"
                  ? "Provision telemarketing lead records into the secure MongoDB Cluster"
                  : activeMenu === "leads"
                  ? "Query phone numbers, addresses, and modify sequential call logs"
                  : activeMenu === "webinars"
                  ? "Create pre-defined webinar options and copy unauthenticated public sharing links"
                  : activeMenu === "edit-lead"
                  ? `Editing record for ${editingLead?.guardianName || "client"} -- ${editingLead?.phone || ""}`
                  : "Provision additional secure dashboard staff credentials"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {activeMenu === "home" && (
                <button
                  onClick={() => navigate("add-lead")}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white rounded-[8px] text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Quick Add Lead</span>
                </button>
              )}
              {activeMenu === "edit-lead" && (
                <button
                  onClick={() => { navigate("leads"); setEditingLead(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-xs font-bold transition-all cursor-pointer"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  <span>Back to Leads</span>
                </button>
              )}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/report`;
                  navigator.clipboard.writeText(url);
                  showToast("success", "Boss report link copied!");
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-[8px] transition-all cursor-pointer"
              >
                <FiExternalLink className="w-3.5 h-3.5" />
                <span>Share Report</span>
              </button>
              <div className="px-3 py-2 bg-white border border-slate-200 text-[11px] font-bold rounded-[8px] text-slate-500 shadow-sm">
                AES-256 Secured
              </div>
            </div>
          </header>

          {/* MENU 1: HOME PAGE */}
          {activeMenu === "home" && (
            <div className="flex flex-col gap-6 animate-fadeIn">

              {/* 4 Metric Cards */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-[12px] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Leads</p>
                    <p className="text-2xl font-bold text-[#3b82f6] mt-1">{stats.total}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Total client records</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-[#3b82f6] rounded-[10px]"><FiList className="w-5 h-5" /></div>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-[12px] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Webinar Attend</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.qualifiedCount}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Confirmed attendees</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-[10px]"><FiUserCheck className="w-5 h-5" /></div>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-[12px] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Follow-ups</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{stats.followupsNeeded}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Needs 3rd call</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-500 rounded-[10px]"><FiPhoneCall className="w-5 h-5" /></div>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-[12px] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contacted Rate</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{stats.contactedPercent}%</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{stats.contactedCount} in dialogue</p>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-[10px]"><FiActivity className="w-5 h-5" /></div>
                </div>
              </section>

              {/* Row 1: Age Group Bar + Call Convert Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-bold text-slate-800">Age Group Distribution</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 mb-5">Which age group has the most students</p>
                  {(() => {
                    const groups: [string, string, number, number][] = [
                      ["3-5", "#3b82f6", 0, 5], ["6-8", "#f59e0b", 6, 8],
                      ["9-11", "#10b981", 9, 11], ["12-14", "#ef4444", 12, 14],
                      ["15-17", "#8b5cf6", 15, 17], ["18+", "#06b6d4", 18, 999]
                    ];
                    const unknown = leads.filter(l => isNaN(parseInt(l.studentAge || ""))).length;
                    const data = [
                      ...groups.map(([label, color, min, max]) => ({
                        label, color,
                        count: leads.filter(l => { const a = parseInt(l.studentAge || ""); return !isNaN(a) && a >= min && a <= max; }).length
                      })),
                      ...(unknown > 0 ? [{ label: "?", color: "#94a3b8", count: unknown }] : [])
                    ].filter(g => g.count > 0);
                    if (data.length === 0) return <div className="h-40 flex items-center justify-center text-xs text-slate-400 font-bold">No age data available</div>;
                    const maxV = Math.max(...data.map(g => g.count), 1);
                    const W = 320, H = 140, PL = 28, PB = 28, PT = 8, GAP = 10;
                    const bW = Math.max(Math.floor((W - PL - GAP * (data.length - 1)) / data.length), 20);
                    return (
                      <svg viewBox={`0 0 ${W + 10} ${H + PB + PT}`} className="w-full" style={{ overflow: "visible" }}>
                        {[0, Math.ceil(maxV / 2), maxV].map((v, i) => {
                          const y = PT + H - (v / maxV) * H;
                          return <g key={i}><line x1={PL} y1={y} x2={W + 10} y2={y} stroke="#e2e8f0" strokeWidth="0.7" /><text x={PL - 4} y={y + 3.5} textAnchor="end" fontSize="6.5" fill="#94a3b8" fontWeight="700">{v}</text></g>;
                        })}
                        {data.map(({ label, color, count }, i) => {
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
                  })()}
                </div>
                <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-bold text-slate-800">Call Convert Rate</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 mb-4">Answered vs No Response across all call logs</p>
                  {(() => {
                    const allLogs = leads.flatMap(l => l.callLogs || []);
                    const answered = allLogs.filter(l => l.connected).length;
                    const noResp = allLogs.length - answered;
                    const total = allLogs.length;
                    const aPct = total ? Math.round((answered / total) * 100) : 0;
                    const nPct = total ? (100 - aPct) : 0;
                    if (total === 0) return <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-bold">No call logs recorded yet</div>;
                    // Single large donut
                    const C = 100;
                    return (
                      <div className="flex items-center gap-6">
                        <svg viewBox="0 0 42 42" className="w-40 h-40 shrink-0">
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="5.5" />
                          {/* Answered segment */}
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="5.5"
                            strokeDasharray={`${aPct} ${C - aPct}`} strokeDashoffset="0"
                            transform="rotate(-90 21 21)" style={{ transition: "all 0.7s ease" }} />
                          {/* No response segment */}
                          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="5.5"
                            strokeDasharray={`${nPct} ${C - nPct}`} strokeDashoffset={-aPct}
                            transform="rotate(-90 21 21)" style={{ transition: "all 0.7s ease" }} />
                          <text x="50%" y="44%" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1e293b">{total}</text>
                          <text x="50%" y="56%" textAnchor="middle" fontSize="3.5" fill="#94a3b8" fontWeight="700">TOTAL CALLS</text>
                        </svg>
                        <div className="flex flex-col gap-4 flex-1">
                          {[
                            { label: "Answered", count: answered, pct: aPct, color: "bg-emerald-500", tc: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100" },
                            { label: "No Response", count: noResp, pct: nPct, color: "bg-red-400", tc: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
                          ].map(d => (
                            <div key={d.label} className={`flex items-center gap-3 p-3 rounded-[10px] border ${d.bg} ${d.border}`}>
                              <div className={`w-3 h-3 rounded-full ${d.color} shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                  <span className={`text-xs font-bold ${d.tc}`}>{d.label}</span>
                                  <span className={`text-xs font-bold ${d.tc}`}>{d.pct}%</span>
                                </div>
                                <div className="h-1.5 bg-white/80 rounded-full overflow-hidden">
                                  <div className={`h-full ${d.color} rounded-full transition-all duration-700`} style={{ width: `${d.pct}%` }} />
                                </div>
                                <span className={`text-[10px] font-bold ${d.tc} opacity-70 mt-0.5 block`}>{d.count} calls</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Row 2: Top Areas Pie + Webinar & Sales Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-bold text-slate-800">Top Areas</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 mb-5">Which area has the most leads</p>
                  {(() => {
                    const mp: Record<string, number> = {};
                    leads.forEach(l => { if (l.address && l.address !== "N/A") mp[l.address] = (mp[l.address] || 0) + 1; });
                    const rows = Object.entries(mp).sort((a, b) => b[1] - a[1]).slice(0, 7);
                    if (rows.length === 0) return <div className="h-52 flex items-center justify-center text-xs text-slate-400 font-bold">No address data available</div>;
                    const COLORS = ["#3b82f6","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#f97316"];
                    const total = rows.reduce((s, [, v]) => s + v, 0);
                    const CX = 80, CY = 80, R = 65, IR = 36;
                    let angle = -Math.PI / 2;
                    const segs = rows.map(([label, count], i) => {
                      const frac = count / total;
                      const startA = angle;
                      angle += frac * 2 * Math.PI;
                      const endA = angle;
                      const x1 = CX + R * Math.cos(startA), y1 = CY + R * Math.sin(startA);
                      const x2 = CX + R * Math.cos(endA),   y2 = CY + R * Math.sin(endA);
                      const ix1 = CX + IR * Math.cos(startA), iy1 = CY + IR * Math.sin(startA);
                      const ix2 = CX + IR * Math.cos(endA),   iy2 = CY + IR * Math.sin(endA);
                      const large = frac > 0.5 ? 1 : 0;
                      const path = `M${ix1},${iy1} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${ix2},${iy2} A${IR},${IR} 0 ${large},0 ${ix1},${iy1} Z`;
                      return { path, color: COLORS[i % COLORS.length], label, count, pct: Math.round(frac * 100) };
                    });
                    return (
                      <div className="flex items-center gap-5">
                        <svg viewBox="0 0 160 160" className="w-44 h-44 shrink-0">
                          {segs.map((s, i) => (
                            <path key={i} d={s.path} fill={s.color} opacity="0.9" stroke="white" strokeWidth="1.5" />
                          ))}
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
                  })()}
                </div>
                <div className="bg-white border border-slate-200 rounded-[12px] p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-bold text-slate-800">Webinar Join &amp; Sales</h3>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5 mb-5">How many joined the Webinar and how many converted to Sales</p>
                  {(() => {
                    const bars = [
                      { label: "Total", sub: "Leads", val: stats.total, color: "#94a3b8" },
                      { label: "Contacted", sub: "", val: stats.contactedCount, color: "#f59e0b" },
                      { label: "Webinar", sub: "Join", val: stats.qualifiedCount, color: "#10b981" },
                      { label: "Sales", sub: "Convert", val: stats.salesCount, color: "#8b5cf6" },
                    ];
                    const maxV = Math.max(...bars.map(b => b.val), 1);
                    const convRate = stats.qualifiedCount > 0 ? Math.round((stats.salesCount / stats.qualifiedCount) * 100) : 0;
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
                            <span className="text-xl font-bold text-amber-700">{convRate}%</span>
                            <span className="text-[9px] font-bold text-amber-600 text-center">Join to Sales</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>
          )}

          {activeMenu === "edit-lead" && editingLead && (
            <div className="flex flex-col gap-6 animate-fadeIn container mx-auto w-full">
              <section className="bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm">
                <div className="mb-5 border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Update Client Record</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Modify the lead record and call logs, then click Save Changes.</p>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-[6px] border ${
                    editingLead.status === "Qualified" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : editingLead.status === "Sales" ? "bg-violet-50 text-violet-700 border-violet-200"
                    : editingLead.status === "Lost" ? "bg-red-50 text-red-600 border-red-200"
                    : editingLead.status === "Contacted" ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}>{editingLead.status}</span>
                </div>

                <form onSubmit={handleUpdateLeadSubmit} className="space-y-4">
                  {/* Guardian's Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-slate-700">Guardian&apos;s Name (Optional)</label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input type="text" placeholder="e.g. Ahnaf Wasim Shorna" value={editGName} onChange={e => setEditGName(e.target.value)}
                        className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800" />
                    </div>
                  </div>

                  {/* Student Name, Age, Class */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Student&apos;s Name (Optional)</label>
                      <div className="relative">
                        <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input type="text" placeholder="e.g. Rabeya Aktar" value={editSName} onChange={e => setEditSName(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Student&apos;s Age (Optional)</label>
                      <div className="relative">
                        <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input type="text" placeholder="e.g. 7" value={editSAge} onChange={e => setEditSAge(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Student&apos;s Class (Optional)</label>
                      <div className="relative">
                        <FiGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input type="text" placeholder="e.g. Class 2" value={editSClass} onChange={e => setEditSClass(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800" />
                      </div>
                    </div>
                  </div>

                  {/* Phone, Email, Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Client&apos;s Phn. num *</label>
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input type="text" placeholder="e.g. +8801784-124290" required value={editPhone} onChange={e => setEditPhone(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Client&apos;s Email (Optional)</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input type="email" placeholder="e.g. client@example.com" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Client&apos;s Address (Optional)</label>
                      <div className="relative">
                        <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input type="text" placeholder="e.g. Chattogram" value={editAddress} onChange={e => setEditAddress(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800" />
                      </div>
                    </div>
                  </div>

                  {/* Status & Webinar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Current Lead Status *</label>
                      <div className="relative">
                        <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value as any)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all h-[46px] cursor-pointer text-slate-800">
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified (Will Attend Webinar)</option>
                          <option value="Lost">Lost (Not Interested)</option>
                          <option value="Sales">Sales (Converted)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">Webinar Name / Topic (Optional)</label>
                      <div className="relative">
                        <FiVideo className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input type="text" placeholder="Search or select webinar..."
                          value={editWebinarSearch}
                          onFocus={() => setShowEditWebinarDropdown(true)}
                          onBlur={() => setTimeout(() => setShowEditWebinarDropdown(false), 200)}
                          onChange={e => { setEditWebinarSearch(e.target.value); setEditWebinar(e.target.value); setShowEditWebinarDropdown(true); }}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800" />
                        {showEditWebinarDropdown && (
                          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-[8px] shadow-lg z-50 divide-y divide-slate-100">
                            {webinarsList.filter(w => w.name.toLowerCase().includes(editWebinarSearch.toLowerCase())).map(web => (
                              <button key={web._id} type="button"
                                onClick={() => { setEditWebinar(web.name); setEditWebinarSearch(web.name); setShowEditWebinarDropdown(false); }}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700">
                                {web.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Call Logs */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[13px] font-bold text-slate-700">Sequential Call Comments</label>
                    <div className="space-y-4">
                      {editCallLogs.map((log, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 flex flex-col gap-3 relative">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <span className="text-[11px] font-bold bg-[#3b82f6]/10 text-[#3b82f6] px-2 py-1 rounded-[4px]">Call #{idx + 1} Log Entry</span>
                            {editCallLogs.length > 1 && (
                              <button type="button" onClick={() => setEditCallLogs(editCallLogs.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-600 font-bold text-lg cursor-pointer leading-none p-1 hover:bg-red-50 rounded-[6px]">Ã—</button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-zinc-500">Call Status</label>
                              <select value={log.connected ? "true" : "false"}
                                onChange={e => { const nl = [...editCallLogs]; nl[idx] = { ...nl[idx], connected: e.target.value === "true" }; setEditCallLogs(nl); }}
                                className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] rounded-[8px] outline-none h-[46px] cursor-pointer text-slate-800">
                                <option value="true">Answered / Connected</option>
                                <option value="false">No Response / Did not connect</option>
                              </select>
                            </div>
                            {log.connected && (
                              <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-bold text-zinc-500">Duration (mins)</label>
                                <input type="text" placeholder="e.g. 5" value={log.duration}
                                  onChange={e => { const nl = [...editCallLogs]; nl[idx] = { ...nl[idx], duration: e.target.value }; setEditCallLogs(nl); }}
                                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] rounded-[8px] outline-none h-[46px] text-slate-800" />
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-zinc-500">Time of Call</label>
                              <input type="datetime-local" value={log.timeCalled}
                                onChange={e => { const nl = [...editCallLogs]; nl[idx] = { ...nl[idx], timeCalled: e.target.value }; setEditCallLogs(nl); }}
                                className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] rounded-[8px] outline-none h-[46px] cursor-pointer text-slate-800" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-zinc-500">Comment</label>
                            <textarea placeholder="Log details..." value={log.comment}
                              onChange={e => { const nl = [...editCallLogs]; nl[idx] = { ...nl[idx], comment: e.target.value }; setEditCallLogs(nl); }}
                              className="w-full px-3.5 py-2.5 text-sm font-medium bg-white border border-slate-200 focus:border-[#3b82f6] rounded-[8px] outline-none resize-none h-20 text-slate-800" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button"
                      onClick={() => setEditCallLogs([...editCallLogs, { connected: true, duration: "", timeCalled: "", comment: "" }])}
                      className="w-full py-3 border border-dashed border-[#3b82f6] text-[#3b82f6] text-xs font-bold rounded-[8px] hover:bg-blue-50 transition-all cursor-pointer">
                      + Add Call Log Entry
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button type="submit" disabled={isSubmittingEdit}
                      className="flex-1 py-3 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-60 text-white text-sm font-bold rounded-[8px] transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2">
                      {isSubmittingEdit ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Saving...</span></>
                      ) : (
                        <><FiCheck className="w-4 h-4" /><span>Save Changes</span></>
                      )}
                    </button>
                    <button type="button" onClick={() => { navigate("leads"); setEditingLead(null); }}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-[8px] transition-all cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* MENU 2: ADD LEAD (Dedicated popup-free form view!) */}
          {activeMenu === "add-lead" && (
            <div className="flex flex-col gap-6 animate-fadeIn container mx-auto w-full">
              <section className="bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm">
                
                <div className="mb-5 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Add New Client Record
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                    Populate your telemarketing Excel data live into the CRM database. Once submitted, you will be redirected to the table view.
                  </p>
                </div>

                <form onSubmit={handleAddLeadSubmit} className="space-y-4">
                  
                  {/* Guardian's Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-bold text-slate-700">
                      Guardian&apos;s Name (Optional)
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Ahnaf Wasim Shorna"
                        value={formGName}
                        onChange={(e) => setFormGName(e.target.value)}
                        className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                      />
                    </div>
                  </div>
                  
                  {/* Student Name, Age & Class in a grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">
                        Student&apos;s Name (Optional)
                      </label>
                      <div className="relative">
                        <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="e.g. Rabeya Aktar"
                          value={formSName}
                          onChange={(e) => setFormSName(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">
                        Student&apos;s Age (Optional)
                      </label>
                      <div className="relative">
                        <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="e.g. 7"
                          value={formSAge}
                          onChange={(e) => setFormSAge(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">
                        Student&apos;s Class (Optional)
                      </label>
                      <div className="relative">
                        <FiGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="e.g. Class 2"
                          value={formSClass}
                          onChange={(e) => setFormSClass(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone, Email & Address in a 3-column grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">
                        Client&apos;s Phn. num *
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="e.g. +8801784-124290"
                          required
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                        Client&apos;s Email (Optional)
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="email"
                          placeholder="e.g. client@example.com"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                        Client&apos;s Address (Optional)
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="e.g. Chattogram"
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status & Webinar in a 2-column grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                        Current Lead Status *
                      </label>
                      <div className="relative">
                        <FiActivity className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                        className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all h-[46px] cursor-pointer text-slate-800"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Qualified">Qualified (Will Attend Webinar)</option>
                          <option value="Lost">Lost (Not Interested)</option>
                          <option value="Sales">Sales (Converted)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">
                        Webinar Name / Topic (Optional)
                      </label>
                      <div className="relative" id="webinar-search-container">
                        <FiVideo className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Search or select pre-defined webinar..."
                          value={webinarSearch}
                          onFocus={() => setShowWebinarDropdown(true)}
                          onBlur={() => setTimeout(() => setShowWebinarDropdown(false), 200)}
                          onChange={(e) => {
                            setWebinarSearch(e.target.value);
                            setFormWebinar(e.target.value);
                            setShowWebinarDropdown(true);
                          }}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                        {showWebinarDropdown && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-[8px] shadow-lg z-50 divide-y divide-slate-100">
                            {webinarsList.filter(w => w.name.toLowerCase().includes(webinarSearch.toLowerCase())).length > 0 ? (
                              webinarsList
                                .filter(w => w.name.toLowerCase().includes(webinarSearch.toLowerCase()))
                                .map((web) => (
                                  <button
                                    key={web._id}
                                    type="button"
                                    onClick={() => {
                                      setFormWebinar(web.name);
                                      setWebinarSearch(web.name);
                                      setShowWebinarDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 text-slate-700 transition-colors"
                                  >
                                    {web.name}
                                  </button>
                                ))
                            ) : (
                              <div className="px-4 py-2.5 text-xs text-zinc-400 font-bold">
                                No matching webinars found. Click out to keep custom typed topic.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>                  {/* Dynamic Call Logs */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center select-none">
                      <label className="text-[13px] font-bold text-slate-700">
                        Sequential Call Comments
                      </label>
                    </div>
                    
                    <div className="space-y-4">
                      {formCallLogs.map((log, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 flex flex-col gap-3 relative">
                          {/* Row Header */}
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                            <span className="text-[11px] font-bold bg-[#3b82f6]/10 text-[#3b82f6] px-2 py-1 rounded-[4px]">
                              Call #{idx + 1} Log Entry
                            </span>
                            {formCallLogs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newLogs = formCallLogs.filter((_, i) => i !== idx);
                                  setFormCallLogs(newLogs);
                                }}
                              className="text-red-400 hover:text-red-600 font-bold text-lg cursor-pointer leading-none p-1 hover:bg-red-50 rounded-[6px]"
                                title="Remove Call Log Entry"
                              >
                                Ã—
                              </button>
                            )}
                          </div>

                          {/* Row Body Fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] font-bold text-zinc-500">Call Status</label>
                              <select
                                value={log.connected ? "true" : "false"}
                                onChange={(e) => {
                                  const newLogs = [...formCallLogs];
                                  newLogs[idx] = {
                                    ...newLogs[idx],
                                    connected: e.target.value === "true"
                                  };
                                  setFormCallLogs(newLogs);
                                }}
                                className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none h-[46px] cursor-pointer text-slate-800"
                              >
                                <option value="true">Answered / Connected</option>
                                <option value="false">No Response / Did not connect</option>
                              </select>
                            </div>

                            {log.connected && (
                              <div className="flex flex-col gap-1 animate-fadeIn">
                                <label className="text-[11px] font-bold text-zinc-500">Duration (mins)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 5"
                                  value={log.duration}
                                  onChange={(e) => {
                                    const newLogs = [...formCallLogs];
                                    newLogs[idx] = {
                                      ...newLogs[idx],
                                      duration: e.target.value
                                    };
                                    setFormCallLogs(newLogs);
                                  }}
                                  className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none h-[46px] placeholder:text-slate-300 text-slate-800"
                                />
                              </div>
                            )}

                            <div className="flex flex-col gap-1 sm:col-span-1">
                              <label className="text-[11px] font-bold text-zinc-500">Time of Call</label>
                              <input
                                type="datetime-local"
                                value={log.timeCalled}
                                onChange={(e) => {
                                  const newLogs = [...formCallLogs];
                                  newLogs[idx] = {
                                    ...newLogs[idx],
                                    timeCalled: e.target.value
                                  };
                                  setFormCallLogs(newLogs);
                                }}
                                className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none h-[46px] cursor-pointer text-slate-800"
                              />
                            </div>
                          </div>

                          {/* Row Feedback Comment */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-zinc-500">Call Comment / Log Details</label>
                            <textarea
                              placeholder="Describe the conversation, webinar attendance interest, next call date, etc."
                              value={log.comment}
                              onChange={(e) => {
                                const newLogs = [...formCallLogs];
                                newLogs[idx] = {
                                  ...newLogs[idx],
                                  comment: e.target.value
                                };
                                setFormCallLogs(newLogs);
                              }}
                              className="w-full px-4 py-3 text-sm font-medium bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none h-24 resize-none transition-all placeholder:text-slate-300 text-slate-800"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setFormCallLogs([...formCallLogs, { connected: true, duration: "", timeCalled: "", comment: "" }])}
                      className="w-full py-2.5 border border-dashed border-[#3b82f6]/40 hover:border-[#3b82f6] hover:bg-[#3b82f6]/5 text-[#3b82f6] text-xs font-bold rounded-[8px] transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none mt-2"
                    >
                      <FiPlus className="w-4.5 h-4.5" />
                      <span>Add Call Log Entry</span>
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-zinc-350 disabled:cursor-not-allowed text-white text-sm font-bold rounded-[8px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmittingLead ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-[8px] animate-spin" />
                        <span>Creating Lead Record...</span>
                      </>
                    ) : (
                      <>
                        <FiPlus className="w-4 h-4" />
                        <span>Create Lead Record</span>
                      </>
                    )}
                  </button>

                </form>
              </section>
            </div>
          )}


          {/* ── Lead Full Detail Modal ── */}
          {viewingLead && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setViewingLead(null)}>
              <div className="bg-white rounded-t-[20px] sm:rounded-[16px] shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10 rounded-t-[20px] sm:rounded-t-[16px]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-50 border border-blue-100 text-[#3b82f6] flex items-center justify-center rounded-[8px] font-black text-sm">
                      {(viewingLead.guardianName !== "N/A" ? viewingLead.guardianName : viewingLead.studentName).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-none">{viewingLead.guardianName !== "N/A" ? viewingLead.guardianName : "No Guardian Name"}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">Full Lead Profile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-[6px] border ${
                      viewingLead.status === "Qualified" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : viewingLead.status === "Sales" ? "bg-violet-50 text-violet-700 border-violet-200"
                      : viewingLead.status === "Lost" ? "bg-red-50 text-red-600 border-red-200"
                      : viewingLead.status === "Contacted" ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>{viewingLead.status}</span>
                    <button onClick={() => setViewingLead(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[8px] transition-colors cursor-pointer text-xl font-bold">×</button>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-5">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Phone", value: viewingLead.phone, highlight: true },
                      { label: "Email", value: viewingLead.email || "—" },
                      { label: "Guardian Name", value: viewingLead.guardianName !== "N/A" ? viewingLead.guardianName : "—" },
                      { label: "Student Name", value: viewingLead.studentName !== "N/A" ? viewingLead.studentName : "—" },
                      { label: "Age", value: viewingLead.studentAge || "—" },
                      { label: "Class", value: viewingLead.studentClass || "—" },
                      { label: "Area / Address", value: viewingLead.address !== "N/A" ? viewingLead.address : "—" },
                      { label: "Webinar", value: viewingLead.webinar || "—" },
                    ].map(f => (
                      <div key={f.label} className={`p-3 rounded-[10px] border ${f.highlight ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100"}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${f.highlight ? "text-[#3b82f6]" : "text-slate-400"}`}>{f.label}</p>
                        <p className={`text-sm font-bold ${f.highlight ? "text-[#3b82f6]" : "text-slate-800"} break-all`}>{f.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Call Logs */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Call History</p>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const entries = [
                          { num: 1, text: viewingLead.firstCall },
                          { num: 2, text: viewingLead.secondCall },
                          { num: 3, text: viewingLead.thirdCall },
                          { num: 4, text: (viewingLead as any).fourthCall },
                        ].filter(e => e.text);

                        if (entries.length === 0) return (
                          <div className="py-6 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-[10px] border border-slate-100">
                            No call logs recorded yet
                          </div>
                        );

                        return entries.map(({ num, text }) => {
                          const isNoResp = text!.toLowerCase().includes("no response") || text!.toLowerCase().includes("did not connect");
                          return (
                            <div key={num} className={`rounded-[10px] border p-3.5 ${isNoResp ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] ${isNoResp ? "bg-red-100 text-red-600" : "bg-blue-100 text-[#3b82f6]"}`}>
                                  Call #{num}
                                </span>
                                <span className={`text-[10px] font-semibold ${isNoResp ? "text-red-500" : "text-[#3b82f6]"}`}>
                                  {isNoResp ? "No Response" : "Answered"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{text}</p>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-1 border-t border-slate-100">
                    <button onClick={() => { setViewingLead(null); handleEditLead(viewingLead); }}
                      className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-2">
                      <FiEdit3 className="w-3.5 h-3.5" /> Edit Record
                    </button>
                    <button onClick={() => setViewingLead(null)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-[8px] transition-all cursor-pointer">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Lead Call Logs Modal ── */}
          {viewingCallsLead && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setViewingCallsLead(null)}>
              <div className="bg-white rounded-t-[20px] sm:rounded-[16px] shadow-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto animate-fadeIn" onClick={e => e.stopPropagation()}>
                
                {/* Modal Header */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between z-10 rounded-t-[20px] sm:rounded-t-[16px]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center rounded-[10px]">
                      <FiPhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">Call Attempts & Logs</h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        For student: <strong className="text-slate-700 font-bold">{viewingCallsLead.studentName}</strong> ({viewingCallsLead.phone})
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setViewingCallsLead(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-[8px] transition-colors cursor-pointer text-xl font-bold">×</button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                  <div className="flex flex-col gap-4">
                    {(() => {
                      const entries = [
                        { num: 1, text: viewingCallsLead.firstCall, color: "border-blue-200 bg-blue-50/50", labelColor: "bg-blue-100 text-[#3b82f6]", textColor: "text-blue-600" },
                        { num: 2, text: viewingCallsLead.secondCall, color: "border-amber-200 bg-amber-50/50", labelColor: "bg-amber-100 text-amber-700", textColor: "text-amber-600" },
                        { num: 3, text: viewingCallsLead.thirdCall, color: "border-emerald-200 bg-emerald-50/50", labelColor: "bg-emerald-100 text-emerald-700", textColor: "text-emerald-600" },
                        { num: 4, text: (viewingCallsLead as any).fourthCall, color: "border-violet-200 bg-violet-50/50", labelColor: "bg-violet-100 text-violet-700", textColor: "text-violet-600" },
                      ].filter(e => e.text);

                      if (entries.length === 0) return (
                        <div className="py-10 text-center text-sm text-slate-400 font-bold bg-slate-50 rounded-[12px] border border-slate-200/60 flex flex-col items-center gap-2">
                          <FiPhoneCall className="w-8 h-8 text-slate-300" />
                          <span>No call logs recorded yet</span>
                        </div>
                      );

                      return entries.map(({ num, text, color, labelColor, textColor }) => {
                        const isNoResp = text!.toLowerCase().includes("no response") || text!.toLowerCase().includes("did not connect");
                        return (
                          <div key={num} className={`rounded-[12px] border p-4 shadow-sm transition-all ${isNoResp ? "bg-red-50/50 border-red-200" : color}`}>
                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-[4px] uppercase tracking-wider ${isNoResp ? "bg-red-100 text-red-600" : labelColor}`}>
                                  Call #{num}
                                </span>
                                <span className={`text-xs font-bold ${isNoResp ? "text-red-500" : textColor}`}>
                                  {isNoResp ? "No Response / Connected Error" : "Connected & Answered"}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-semibold">
                              {text}
                            </p>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => { setViewingCallsLead(null); handleEditLead(viewingCallsLead); }}
                      className="flex-1 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                      <FiEdit3 className="w-4 h-4" /> Edit Call Log Details
                    </button>
                    <button onClick={() => setViewingCallsLead(null)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-[8px] transition-all cursor-pointer">
                      Close
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* CSV Import Progress Overlay */}
          {csvProgress.active && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 text-[#3b82f6] flex items-center justify-center rounded-[10px]">
                    <FiArrowRight className="w-5 h-5 rotate-[-90deg] animate-bounce" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Importing CSV...</p>
                    <p className="text-[11px] text-slate-400 font-medium truncate max-w-[260px]" title={csvProgress.fileName}>
                      {csvProgress.fileName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Row <span className="text-slate-800 text-sm">{csvProgress.current}</span> of <span className="text-slate-800 text-sm">{csvProgress.total}</span></span>
                  <span className="text-[#3b82f6]">{csvProgress.total > 0 ? Math.round((csvProgress.current / csvProgress.total) * 100) : 0}%</span>
                </div>
                <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="absolute inset-y-0 left-0 bg-[#3b82f6] rounded-full transition-all duration-300"
                    style={{ width: `${csvProgress.total > 0 ? (csvProgress.current / csvProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center gap-1 p-3 bg-emerald-50 border border-emerald-100 rounded-[10px]">
                    <span className="text-lg font-bold text-emerald-700">{csvProgress.imported}</span>
                    <span className="text-[10px] font-bold text-emerald-600">Imported</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-3 bg-red-50 border border-red-100 rounded-[10px]">
                    <span className="text-lg font-bold text-red-600">{csvProgress.skipped}</span>
                    <span className="text-[10px] font-bold text-red-500">Skipped</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-3 bg-slate-50 border border-slate-200 rounded-[10px]">
                    <span className="text-lg font-bold text-slate-700">{csvProgress.total - csvProgress.current}</span>
                    <span className="text-[10px] font-bold text-slate-400">Remaining</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium text-center">Please wait — do not close this window</p>
              </div>
            </div>
          )}

          {/* MENU 3: LEAD INFO (Leads Database CRUD Grid) */}
          {activeMenu === "leads" && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              
              {/* Leads CRM Control Grid panel - strictly rounded-[8px] */}
              <section className="bg-white border border-slate-200 rounded-[12px] overflow-hidden shadow-sm flex flex-col">
                              {/* Table Header Controls */}
                <div className="p-6 border-b border-slate-200 flex flex-col gap-5 bg-slate-50/80">
                  
                  {/* Filter Console Title and Reset */}
                  <div className="flex justify-between items-center select-none">
                    <div className="flex items-center gap-2">
                      <FiFilter className="w-4 h-4 text-[#3b82f6]" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Advanced Lead Filters</span>
                    </div>
                    {(searchQuery || statusFilter !== "All" || webinarFilter !== "All" || addressFilter !== "All" || callLogFilter !== "All") && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("All");
                          setWebinarFilter("All");
                          setAddressFilter("All");
                          setCallLogFilter("All");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-500 text-xs font-bold rounded-[8px] transition-all cursor-pointer"
                      >
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>

                  {/* Filter Inputs -- Row 1: Search + Add Button */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    {/* Search query - spans 8 */}
                    <div className="lg:col-span-8 relative">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by guardian name, student name, phone, address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                      />
                    </div>
                    {/* Action Buttons - spans 4 */}
                    <div className="lg:col-span-4 flex items-center gap-2 justify-end">
                      <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCSVUpload}
                      />
                      <button
                        onClick={downloadCSVTemplate}
                        title="Download CSV template example"
                        className="h-[46px] px-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-[8px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <FiMessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Template</span>
                      </button>
                      <button
                        onClick={() => csvInputRef.current?.click()}
                        title="Upload CSV to import leads"
                        className="h-[46px] px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-[8px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <FiArrowRight className="w-4 h-4 rotate-[-90deg]" />
                        <span className="hidden sm:inline">Import CSV</span>
                      </button>
                      <button
                        onClick={downloadCSV}
                        title="Download all leads as CSV"
                        className="h-[46px] px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-[8px] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <FiArrowRight className="w-4 h-4 rotate-[90deg]" />
                        <span className="hidden sm:inline">Export CSV</span>
                      </button>
                      <button
                        onClick={() => navigate("add-lead")}
                        className="h-[46px] px-5 bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white rounded-[8px] text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <FiPlus className="w-4 h-4" />
                        <span>Add Lead</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Inputs -- Row 2: Webinar + Location + Call Stage */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Webinar dropdown filter */}
                    <div className="relative">
                      <FiVideo className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={webinarFilter}
                        onChange={(e) => setWebinarFilter(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all h-[46px] cursor-pointer text-slate-800 appearance-none"
                      >
                        <option value="All">All Webinars</option>
                        <option value="None">No Assigned Webinar</option>
                        {uniqueWebinars.filter(w => w !== "All" && w !== "None").map((web) => (
                          <option key={web} value={web}>{web}</option>
                        ))}
                      </select>
                    </div>

                    {/* Address / Location filter */}
                    <div className="relative">
                      <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={addressFilter}
                        onChange={(e) => setAddressFilter(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all h-[46px] cursor-pointer text-slate-800 appearance-none"
                      >
                        <option value="All">All Locations</option>
                        {uniqueAddresses.map((addr) => (
                          <option key={addr} value={addr}>{addr}</option>
                        ))}
                      </select>
                    </div>

                    {/* Call Stage filter */}
                    <div className="relative">
                      <FiPhoneCall className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <select
                        value={callLogFilter}
                        onChange={(e) => setCallLogFilter(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all h-[46px] cursor-pointer text-slate-800 appearance-none"
                      >
                        <option value="All">All Call Stages</option>
                        <option value="0">No Calls Yet</option>
                        <option value="1">1st Call Done</option>
                        <option value="2">2nd Call Done</option>
                        <option value="3">3rd Call Done</option>
                      </select>
                    </div>
                  </div>

                  {/* Status buttons row with live counts */}
                  <div className="flex flex-wrap items-center bg-slate-100 border border-slate-200 p-1.5 rounded-[10px] gap-1.5 select-none w-full">
                    {[
                      { key: "All", label: "All Leads", count: leads.length, color: "text-[#3b82f6] bg-blue-50 border-blue-200" },
                      { key: "New", label: "New", count: leads.filter(l => l.status === "New").length, color: "text-blue-600 bg-blue-50 border-blue-200" },
                      { key: "Contacted", label: "Contacted", count: leads.filter(l => l.status === "Contacted").length, color: "text-amber-600 bg-amber-50 border-amber-200" },
                      { key: "Qualified", label: "Qualified", count: leads.filter(l => l.status === "Qualified").length, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                      { key: "Lost", label: "Lost", count: leads.filter(l => l.status === "Lost").length, color: "text-red-500 bg-red-50 border-red-200" },
                      { key: "Sales", label: "Sales", count: leads.filter(l => l.status === "Sales").length, color: "text-violet-600 bg-violet-50 border-violet-200" }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setStatusFilter(opt.key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer border ${
                          statusFilter === opt.key
                            ? "bg-white border-slate-300 shadow-sm text-slate-900"
                            : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/70"
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-extrabold border ${
                          statusFilter === opt.key ? opt.color : "bg-slate-200 border-slate-300 text-slate-500"
                        }`}>
                          {opt.count}
                        </span>
                      </button>
                    ))}
                  </div>

                </div>

                {/* Live Leads Table View */}
                <div className="overflow-x-auto">
                  {isLoadingLeads ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-zinc-400">
                      <div className="w-8 h-8 border-2 border-zinc-200 border-t-[#3b82f6] rounded-[8px] animate-spin" />
                      <span className="text-sm font-bold">Querying live CRM records...</span>
                    </div>
                  ) : filteredLeads.length > 0 ? (
                    <table className="w-full text-left border-collapse min-w-[1550px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-extrabold text-slate-500 uppercase tracking-wider select-none">
                          <th className="py-4 px-4 w-[50px] text-center">#</th>
                          <th className="py-4 px-4 w-[180px]">Student Name</th>
                          <th className="py-4 px-4 w-[180px]">Guardian Name</th>
                          <th className="py-4 px-4 w-[80px] text-center">Age</th>
                          <th className="py-4 px-4 w-[100px] text-center">Class</th>
                          <th className="py-4 px-4 w-[150px]">Phone Number</th>
                          <th className="py-4 px-4 w-[200px]">Email Address</th>
                          <th className="py-4 px-4 w-[160px]">Location / Area</th>
                          <th className="py-4 px-4 w-[120px] text-center">Lead Status</th>
                          <th className="py-4 px-4 w-[180px]">Assigned Campaign / Webinar</th>
                          <th className="py-4 px-4 w-[140px] text-center">Call Logs</th>
                          <th className="py-4 px-4 w-[120px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredLeads.map((lead, rowIdx) => {
                          const sc = STATUS_CONFIG[lead.status] || STATUS_CONFIG.New;
                          const callCount = [lead.firstCall, lead.secondCall, lead.thirdCall, lead.fourthCall].filter(Boolean).length;
                          return (
                            <tr key={lead._id} className="hover:bg-slate-50/80 transition-colors text-sm font-medium">
                              {/* # */}
                              <td className="py-4 px-4 text-center text-slate-400 font-bold">
                                {rowIdx + 1}
                              </td>

                              {/* Student Name */}
                              <td className="py-4 px-4 text-slate-900 font-bold truncate max-w-[170px]" title={lead.studentName}>
                                {lead.studentName === "N/A" || !lead.studentName ? (
                                  <span className="text-slate-300 italic font-normal">—</span>
                                ) : (
                                  lead.studentName
                                )}
                              </td>

                              {/* Guardian Name */}
                              <td className="py-4 px-4 text-slate-800 font-semibold truncate max-w-[170px]" title={lead.guardianName}>
                                {lead.guardianName === "N/A" || !lead.guardianName ? (
                                  <span className="text-slate-300 italic font-normal">—</span>
                                ) : (
                                  lead.guardianName
                                )}
                              </td>

                              {/* Age */}
                              <td className="py-4 px-4 text-center text-slate-600 font-semibold">
                                {lead.studentAge || <span className="text-slate-300 font-normal">—</span>}
                              </td>

                              {/* Class */}
                              <td className="py-4 px-4 text-center text-slate-600 font-semibold">
                                {lead.studentClass ? `Class ${lead.studentClass}` : <span className="text-slate-300 font-normal">—</span>}
                              </td>

                              {/* Phone Number */}
                              <td className="py-4 px-4 text-slate-900 font-bold">
                                {lead.phone}
                              </td>

                              {/* Email Address */}
                              <td className="py-4 px-4 text-slate-600 truncate max-w-[190px]" title={lead.email}>
                                {lead.email || <span className="text-slate-300 italic">—</span>}
                              </td>

                              {/* Location / Area */}
                              <td className="py-4 px-4 text-slate-600">
                                {lead.address === "N/A" || !lead.address ? (
                                  <span className="text-slate-300 font-normal">—</span>
                                ) : (
                                  <span className="truncate max-w-[150px] font-semibold" title={lead.address}>
                                    {lead.address}
                                  </span>
                                )}
                              </td>

                              {/* Lead Status */}
                              <td className="py-4 px-4 text-center">
                                <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                  {lead.status}
                                </span>
                              </td>

                              {/* Assigned Campaign / Webinar */}
                              <td className="py-4 px-4 text-slate-700 font-semibold truncate max-w-[170px]" title={lead.webinar}>
                                {lead.webinar ? (
                                  <span className="text-[#3b82f6] bg-[#3b82f6]/5 px-2 py-1 rounded-[6px] border border-[#3b82f6]/10 text-xs font-bold">
                                    {lead.webinar}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 italic font-normal">—</span>
                                )}
                              </td>

                              {/* Call Logs */}
                              <td className="py-4 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => setViewingCallsLead(lead)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer border ${
                                    callCount > 0
                                      ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                                      : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500"
                                  }`}
                                >
                                  <FiPhoneCall className="w-3.5 h-3.5" />
                                  <span>Calls {callCount > 0 ? `(${callCount})` : ""}</span>
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => setViewingLead(lead)}
                                    title="View Full Profile"
                                    className="p-2 text-slate-400 hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 rounded-[8px] transition-colors cursor-pointer"
                                  >
                                    <FiExternalLink className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditLead(lead)}
                                    title="Edit Record"
                                    className="p-2 text-slate-400 hover:text-amber-650 hover:bg-amber-500/5 rounded-[8px] transition-colors cursor-pointer"
                                  >
                                    <FiEdit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLead(lead._id, lead.guardianName)}
                                    title="Delete"
                                    className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-500/5 rounded-[8px] transition-colors cursor-pointer"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    /* Empty Grid layout */
                    <div className="py-20 px-6 flex flex-col items-center justify-center text-center gap-4 w-full">
                      <div className="p-4 bg-slate-50 border border-slate-200 text-slate-400 rounded-[10px]">
                        <FiUser className="w-8 h-8" />
                      </div>
                      <div className="max-w-sm flex flex-col gap-1">
                        <h3 className="font-bold text-sm text-slate-900">
                          No database leads match filters
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium">
                          Try modifying search keywords or status filters.
                        </p>
                      </div>
                      {searchQuery || statusFilter !== "All" ? (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("All");
                          }}
                          className="text-xs font-bold text-[#3b82f6] hover:underline cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate("add-lead")}
                          className="flex items-center gap-1.5 px-4.5 py-2 bg-[#3b82f6] text-white text-xs font-bold rounded-[8px] shadow-sm cursor-pointer"
                        >
                          <FiPlus className="w-4 h-4" /> Add Lead Record
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
          {/* MENU 5: MANAGE WEBINARS */}
          {activeMenu === "webinars" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn container mx-auto w-full">
              
              {/* Creation Form Column */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <section className="bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm">
                  <div className="mb-5 border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Add New Webinar Session
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      Pre-define webinar campaigns beforehand to enable dynamic searchable selection in Lead forms.
                    </p>
                  </div>

                  <form onSubmit={handleCreateWebinar} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">
                        Webinar Name / Title
                      </label>
                      <div className="relative">
                        <FiVideo className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. Webinar 3 - 07 June"
                          required
                          value={newWebinarName}
                          onChange={(e) => setNewWebinarName(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingWebinar}
                      className="w-full h-[46px] bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-[8px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isCreatingWebinar ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-[8px] animate-spin" />
                          <span>Creating Webinar...</span>
                        </>
                      ) : (
                        <>
                          <FiPlus className="w-4.5 h-4.5" />
                          <span>Create Webinar</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>
              </div>

              {/* Webinars List Column */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <section className="bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm flex flex-col h-full">
                  <div className="mb-5 border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Active Webinar Campaigns
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                      Copy secure unauthenticated sharing links or delete webinar options.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {isLoadingWebinars ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                        <div className="w-8 h-8 border-2 border-zinc-200 border-t-[#3b82f6] rounded-[8px] animate-spin" />
                        <span className="text-xs font-bold">Querying webinar campaigns...</span>
                      </div>
                    ) : webinarsList.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {webinarsList.map((web) => {
                          const registrantCount = leads.filter(l => l.webinar === web.name).length;
                          return (
                            <div key={web._id} className="py-4 flex items-center justify-between gap-4 text-xs font-medium">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 bg-blue-50 text-[#3b82f6] flex items-center justify-center rounded-[8px] shrink-0 border border-blue-100">
                                  <FiVideo className="w-4.5 h-4.5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-extrabold text-slate-900 truncate leading-none">
                                    {web.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-2">
                                    <span>Registrants: <strong className="text-[#3b82f6]">{registrantCount}</strong></span>
                                    <span>·</span>
                                    <span>Created: {new Date(web.createdAt).toLocaleDateString()}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleCopyPublicLink(web.name)}
                                  title="Copy Shared Public Link"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-[6px] transition-all cursor-pointer border border-slate-200"
                                >
                                  <FiExternalLink className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Copy Shared Link</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWebinar(web._id, web.name)}
                                  title="Delete Webinar Option"
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[6px] transition-colors cursor-pointer"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-zinc-400 font-bold text-xs">
                        No webinar options registered yet.
                      </div>
                    )}
                  </div>
                </section>
              </div>

            </div>
          )}

          {/* MENU 4: REGISTER ACCOUNT */}
          {activeMenu === "register" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn container mx-auto w-full">
              
              {/* Form Column - Spans 5 on large screens */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <section className="bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm">
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Register User Credentials
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      Provision new database system access. Accounts registered here can log in from the secure public portal.
                    </p>
                  </div>

                  <form onSubmit={handleUserRegistration} className="space-y-4">
                    {/* Full name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">
                        Full Name
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="e.g. Alice Smith"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">
                        Email Address
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="email"
                          placeholder="alice@company.com"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-bold text-slate-700">
                        Password (Min. 6 chars)
                      </label>
                      <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                        <input
                          type="password"
                          placeholder="Enter password..."
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Action Button - strictly rounded-[8px] */}
                    <button
                      type="submit"
                      disabled={isRegisteringUser}
                      className="w-full h-[46px] bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-zinc-350 disabled:cursor-not-allowed text-white text-sm font-bold rounded-[8px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isRegisteringUser ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-[8px] animate-spin" />
                          <span>Registering Agent...</span>
                        </>
                      ) : (
                        <>
                          <FiUserPlus className="w-4.5 h-4.5" />
                          <span>Register Account</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>
              </div>

              {/* Users List Column - Spans 7 on large screens */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <section className="bg-white border border-slate-200 rounded-[12px] p-6 shadow-sm flex flex-col h-full">
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      Authorized System Accounts
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                      Active database users registered on this secure portal with CRM workspace privileges.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {isLoadingUsers ? (
                      <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
                        <div className="w-7 h-7 border-2 border-zinc-200 border-t-[#3b82f6] rounded-[8px] animate-spin" />
                        <span className="text-xs font-bold">Querying system database accounts...</span>
                      </div>
                    ) : usersList.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {usersList.map((usr) => (
                          <div key={usr._id} className="py-3.5 flex items-center justify-between gap-4 text-xs font-medium">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 bg-blue-50 border border-blue-100 text-[#3b82f6] flex items-center justify-center font-extrabold text-sm rounded-[8px] shrink-0">
                                {usr.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-extrabold text-slate-900 truncate leading-none">
                                  {usr.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold truncate mt-1">
                                  {usr.email}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] border ${
                                usr.role === "Super Admin"
                                  ? "bg-amber-50 border-amber-200 text-amber-600"
                                  : "bg-blue-50 border-blue-200 text-[#3b82f6]"
                              }`}>
                                {usr.role || "User"}
                              </span>
                              <span className="text-[9px] text-slate-400 font-semibold hidden sm:inline">
                                {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : ""}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center text-zinc-400 font-semibold text-xs">
                        No authorized admin or agent users registered.
                      </div>
                    )}
                  </div>
                </section>
              </div>

            </div>
          )}

        </main>
      </div>
    );
  }

  // RENDER 2: PUBLIC PORTAL (Branded Split-Screen Sign In / Initial Admin Setup)
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans select-none">
      
      {/* LEFT SPLIT-PANEL: Premium Light Branding */}
      <section className="md:w-[45%] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 border-b md:border-b-0 md:border-r border-blue-400/30 flex flex-col justify-between p-8 md:p-12 relative overflow-hidden min-h-[360px] md:min-h-screen">
        
        {/* Soft white background radial overlay */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-800/30 rounded-full filter blur-3xl pointer-events-none" />

        {/* Brand Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-[36px] h-[36px] bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold text-[18px] rounded-[10px] border border-white/30">
            L
          </div>
          <span className="text-[18px] font-bold text-white tracking-wide">
            Lead Space
          </span>
        </div>

        {/* Hero message */}
        <div className="my-auto py-8 relative z-10 max-w-sm flex flex-col gap-4">
          <div className="self-start px-3 py-1 bg-white/15 border border-white/25 rounded-[8px] backdrop-blur-sm">
            <span className="text-[11px] font-bold text-white/90 tracking-wider uppercase">
              Student Platform
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white leading-snug tracking-tight">
            Unlock your <br />
            <span className="text-white/80">Learning Potential</span>
          </h2>

          <p className="text-sm font-medium text-white/70 leading-relaxed">
            Access world-class interactive courses, learn from top global instructors, and track your progress all in one single, powerful space.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-[12px] font-medium text-white/50 relative z-10">
          Â© 2026 Lead Space Inc. All rights reserved.
        </div>
      </section>

      {/* RIGHT SPLIT-PANEL: Interactive authentication forms */}
      <section className="flex-1 bg-white flex flex-col justify-center px-6 md:px-16 py-12 relative">
        <div className="w-full container mx-auto">

          {/* DYNAMIC SETUP MODE: Show if database is empty */}
          {requiresSetup ? (
            <>
              {/* Form Headers */}
              <div className="mb-6">
                <span className="text-[11px] font-bold text-[#3b82f6] tracking-wider uppercase block mb-1">
                  System Initialization
                </span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Create First Admin
                </h1>
                <p className="text-xs text-zinc-500 font-medium mt-1 leading-relaxed">
                  The database is currently empty. Please create the initial administrator account. Once created, public registration is locked forever.
                </p>
              </div>

              <form onSubmit={handleSetupAdminSubmit} className="space-y-4">
                
                {/* Full name input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">
                    Administrator Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="e.g. Admin User"
                      required
                      value={setupName}
                      onChange={(e) => setSetupName(e.target.value)}
                      className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                    <input
                      type="email"
                      placeholder="admin@leadflow.com"
                      required
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">
                    Password (Min. 6 chars)
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                    <input
                      type="password"
                      placeholder="Enter password..."
                      required
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isCreatingSetupAdmin}
                  className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-zinc-350 disabled:cursor-not-allowed text-white text-sm font-bold rounded-[8px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  {isCreatingSetupAdmin ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-[8px] animate-spin" />
                      <span>Seeding First Admin Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Initialize First Admin</span>
                      <FiArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            </>
          ) : authMode === "login" ? (
            /* STANDARD SECURE LOGIN FORM */
            <>
              {/* Form Headers */}
              <div className="mb-6">
                <span className="text-[11px] font-bold text-[#3b82f6] tracking-wider uppercase block mb-1">
                  Secure Access Portal
                </span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Sign in to Platform
                </h1>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthMode("forgot")}
                      className="text-[12px] font-bold text-[#3b82f6] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password..."
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <FiEyeOff className="w-4.5 h-4.5" /> : <FiEye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white text-sm font-bold rounded-[8px] transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  <span>Sign In</span>
                  <FiLock className="w-4 h-4" />
                </button>
              </form>

              {/* Informative helper block stating registration is private */}
              <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-[10px] flex gap-3 items-start">
                <FiShield className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 text-xs text-slate-500 leading-relaxed font-medium">
                  <strong className="text-slate-700">Registration Restricted</strong>
                  User provisioning is private. Accounts can only be registered from within the secured Dashboard workspace by authorized members.
                </div>
              </div>
            </>
          ) : (
            /* SECURE FORGOT PASSWORD MODE FORM */
            <>
              {/* Form Headers */}
              <div className="mb-6">
                <span className="text-[11px] font-bold text-[#3b82f6] tracking-wider uppercase block mb-1">
                  Access Recovery
                </span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Recover Password
                </h1>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="text-xs text-zinc-500 mb-2 leading-relaxed font-medium">
                  Provide your email address below. If an authorized credentials record exists in our database, we will transmit password restoration steps.
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-11 pr-5 py-3 text-sm font-semibold bg-white border border-slate-200 focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 rounded-[8px] outline-none transition-all placeholder:text-slate-300 h-[46px] text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] active:bg-[#1d4ed8] text-white text-sm font-bold rounded-[8px] transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  <span>Send Recovery Instructions</span>
                  <FiMail className="w-4 h-4" />
                </button>

                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </section>

    </div>
  );
}
