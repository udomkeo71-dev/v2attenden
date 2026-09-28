"use client";

import React, { useState, useEffect, useRef } from "react";
import { Staff, BranchId, StaffCategory, ShiftDurationHours } from "@/types";
import { BRANCH_LIST, V2_BRANCHES } from "@/lib/branches";
import { loadStaffList, saveStaffList, INITIAL_STAFF } from "@/lib/storage";
import { soundEffects } from "@/lib/audio";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Clock,
  Building2,
  Phone,
  Check,
  X,
  RotateCcw,
  Crown,
  Sparkles,
  Tag,
  QrCode,
  Download,
  GraduationCap,
  Briefcase,
  DollarSign,
  CalendarDays,
  Bot,
  MapPin,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  List,
  KeyRound,
  Copy,
  CheckCheck,
  Link as LinkIcon,
  Camera,
  Upload,
  ImageIcon,
  Share2,
  ExternalLink,
  Send,
} from "lucide-react";
import QRCode from "qrcode";
import Image from "next/image";
import { SalaryManagement } from "@/components/SalaryManagement";

export const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
];

interface StaffManagementProps {
  onStaffUpdated?: (list: Staff[]) => void;
  onBack?: () => void;
  initialTab?: "STAFF" | "SALARY";
}

export const TEACHER_SUBJECTS = [
  "គណិតវិទ្យា",
  "រូបវិទ្យា",
  "គីមីវិទ្យា",
  "ជីវវិទ្យា",
  "ភាសាខ្មែរ",
  "ភាសាអង់គ្លេស",
  "ប្រវត្តិវិទ្យា",
  "ភូមិវិទ្យា",
  "ពលរដ្ឋវិទ្យា",
  "កុំព្យូទ័រ & ICT",
];

export const STAFF_DEPARTMENTS = [
  "គ្រប់គ្រងទូទៅ",
  "គណនេយ្យ & ហិរញ្ញវត្ថុ",
  "រដ្ឋបាលសាខា",
  "ព័ត៌មានវិទ្យា (IT Support)",
  "សេវាអតិថិជន & ទទួលភ្ញៀវ",
  "ទីផ្សារ (Marketing)",
  "សន្តិសុខ & សណ្តាប់ធ្នាប់",
  "អនាម័យ & សេវាកម្ម",
];

export const SHIFT_OPTIONS: {
  hours: ShiftDurationHours;
  labelKhmer: string;
  defaultIn: string;
  defaultOut: string;
}[] = [
  {
    hours: 2,
    labelKhmer: "២ ម៉ោងក្នុងមួយថ្ងៃ",
    defaultIn: "07:30",
    defaultOut: "09:30",
  },
  {
    hours: 4,
    labelKhmer: "៤ ម៉ោងក្នុងមួយថ្ងៃ",
    defaultIn: "07:30",
    defaultOut: "11:30",
  },
  {
    hours: 6,
    labelKhmer: "៦ ម៉ោងក្នុងមួយថ្ងៃ",
    defaultIn: "07:30",
    defaultOut: "14:00",
  },
  {
    hours: 8,
    labelKhmer: "៨ ម៉ោងក្នុងមួយថ្ងៃ",
    defaultIn: "07:30",
    defaultOut: "17:00",
  },
  {
    hours: 12.5,
    labelKhmer: "១២.៥ ម៉ោងក្នុងមួយថ្ងៃ",
    defaultIn: "07:00",
    defaultOut: "19:30",
  },
];

export const StaffManagement: React.FC<StaffManagementProps> = ({
  onStaffUpdated,
  onBack,
  initialTab = "STAFF",
}) => {
  const [mainTab, setMainTab] = useState<"STAFF" | "SALARY">(initialTab);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  useEffect(() => {
    if (initialTab) {
      setMainTab(initialTab);
    }
  }, [initialTab]);

  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "TEACHER" | "STAFF">("ALL");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"CARD" | "LIST">("CARD");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Quick Role Edit Modal
  const [quickRoleStaff, setQuickRoleStaff] = useState<Staff | null>(null);
  const [quickRoleInput, setQuickRoleInput] = useState("");

  // Staff Personal QR Badge Modal
  const [qrModalStaff, setQrModalStaff] = useState<Staff | null>(null);
  const [staffQrDataUrl, setStaffQrDataUrl] = useState<string>("");

  // Form states - completely direct text & 1-tap buttons (NO dropdowns)
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [branchId, setBranchId] = useState<BranchId>("BKK");
  const [category, setCategory] = useState<StaffCategory>("TEACHER");
  const [subject, setSubject] = useState("គណិតវិទ្យា");
  const [department, setDepartment] = useState("រដ្ឋបាលសាខា");
  const [baseSalary, setBaseSalary] = useState<number>(500);
  const [leaveQuota, setLeaveQuota] = useState<number>(18);
  const [leaveUsed, setLeaveUsed] = useState<number>(0);
  const [shiftHours, setShiftHours] = useState<ShiftDurationHours>(8);
  const [checkInTime, setCheckInTime] = useState("07:30");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [passcode, setPasscode] = useState("");
  const [copiedStaffId, setCopiedStaffId] = useState<string | null>(null);

  // Staff Account Pass & Personal Link Modal
  const [passModalStaff, setPassModalStaff] = useState<Staff | null>(null);
  const [passQrDataUrl, setPassQrDataUrl] = useState<string>("");
  const [copiedPassLink, setCopiedPassLink] = useState(false);
  const [copiedPassCode, setCopiedPassCode] = useState(false);
  const [copiedPassText, setCopiedPassText] = useState(false);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = document.createElement("img");
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarUrl(compressed);
          soundEffects.playClick();
        } else {
          setAvatarUrl(rawDataUrl);
          soundEffects.playClick();
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const list = loadStaffList();
    setStaffList(list);
  }, []);

  // Generate next sequential personal staff code for a branch (e.g. V2-BKK08)
  const getNextStaffCode = (targetBranchId: BranchId, currentList: Staff[]): string => {
    const branchStaff = currentList.filter(
      (s) => s.branchId === targetBranchId && s.code && s.code.startsWith(`V2-${targetBranchId}`)
    );
    let maxNum = 0;
    branchStaff.forEach((s) => {
      const match = s.code?.match(new RegExp(`^V2-${targetBranchId}(\\d+)`, "i"));
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `V2-${targetBranchId}${nextNum < 10 ? `0${nextNum}` : nextNum}`;
  };

  const openStaffPassModal = async (staff: Staff) => {
    setPassModalStaff(staff);
    setCopiedPassLink(false);
    setCopiedPassCode(false);
    setCopiedPassText(false);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const directLink = `${origin}/?code=${encodeURIComponent(staff.code || staff.id)}`;
      const qrUrl = await QRCode.toDataURL(directLink, {
        width: 280,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      setPassQrDataUrl(qrUrl);
    } catch (err) {
      console.error("Failed to generate pass QR", err);
    }
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setName("");
    setAvatarUrl("");
    setCategory("TEACHER");
    setSubject("គណិតវិទ្យា");
    setDepartment("រដ្ឋបាលសាខា");
    setRole("គ្រូគណិតវិទ្យា");
    setBranchId("BKK");
    setBaseSalary(500);
    setLeaveQuota(18);
    setLeaveUsed(0);
    setShiftHours(8);
    setCheckInTime("07:30");
    setCheckOutTime("17:00");
    setPhone("");
    setEmail("");
    setCode(getNextStaffCode("BKK", staffList));
    setPasscode("1234");
    setIsModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setName(staff.name);
    setAvatarUrl(staff.avatarUrl || "");
    const cat = staff.category || (staff.role.includes("គ្រូ") ? "TEACHER" : "STAFF");
    setCategory(cat);
    setSubject(staff.subject || "គណិតវិទ្យា");
    setDepartment(staff.department || "រដ្ឋបាលសាខា");
    setRole(staff.role);
    setBranchId(staff.branchId);
    setBaseSalary(staff.baseSalary ?? 500);
    setLeaveQuota(staff.leaveQuota ?? 18);
    setLeaveUsed(staff.leaveUsed ?? 0);
    const sH = staff.shiftHours ?? 8;
    setShiftHours(sH);
    setCheckInTime(staff.checkInTime);
    setCheckOutTime(staff.checkOutTime);
    setPhone(staff.phone || "");
    setEmail(staff.email || "");
    setCode(staff.code || "");
    setPasscode(staff.passcode || "1234");
    setIsModalOpen(true);
  };

  const handleCopyStaffLink = (staff: Staff) => {
    if (typeof window === "undefined") return;
    const staffIdentifier = staff.code || staff.id;
    const directLink = `${window.location.origin}/?code=${encodeURIComponent(staffIdentifier)}`;
    navigator.clipboard.writeText(directLink).then(() => {
      setCopiedStaffId(staff.id);
      setTimeout(() => setCopiedStaffId(null), 2500);
    });
  };

  const handleShiftSelect = (hours: ShiftDurationHours) => {
    setShiftHours(hours);
    const conf = SHIFT_OPTIONS.find((s) => s.hours === hours);
    if (conf) {
      setCheckInTime(conf.defaultIn);
      setCheckOutTime(conf.defaultOut);
    }
  };

  const openQuickRoleModal = (staff: Staff) => {
    setQuickRoleStaff(staff);
    setQuickRoleInput(staff.role);
  };

  const handleSaveQuickRole = () => {
    if (!quickRoleStaff || !quickRoleInput.trim()) return;

    const updated = staffList.map((s) =>
      s.id === quickRoleStaff.id ? { ...s, role: quickRoleInput.trim() } : s
    );
    setStaffList(updated);
    saveStaffList(updated);
    if (onStaffUpdated) onStaffUpdated(updated);
    setQuickRoleStaff(null);
  };

  const openStaffQrModal = async (staff: Staff) => {
    setQrModalStaff(staff);
    try {
      const payload = `V2_STAFF:${staff.id}:${staff.name}:${staff.branchId}`;
      const url = await QRCode.toDataURL(payload, {
        width: 320,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
        errorCorrectionLevel: "H",
      });
      setStaffQrDataUrl(url);
    } catch (err) {
      console.error("Failed to generate staff QR", err);
    }
  };

  const handleDownloadStaffQr = () => {
    if (!qrModalStaff || !staffQrDataUrl) return;
    const link = document.createElement("a");
    link.download = `QR_Badge_${qrModalStaff.name.replace(/\s+/g, "_")}_${qrModalStaff.id}.png`;
    link.href = staffQrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    let updated: Staff[];
    if (editingStaff) {
      // Edit existing
      updated = staffList.map((s) =>
        s.id === editingStaff.id
          ? {
              ...s,
              name: name.trim(),
              role: role.trim(),
              branchId,
              category,
              subject: category === "TEACHER" ? subject.trim() : undefined,
              department: category === "STAFF" ? department.trim() : undefined,
              baseSalary: Number(baseSalary) || 0,
              leaveQuota: Number(leaveQuota) || 18,
              leaveUsed: Number(leaveUsed) || 0,
              shiftHours,
              checkInTime,
              checkOutTime,
              phone: phone.trim(),
              email: email.trim() || undefined,
              code: code.trim() || undefined,
              passcode: passcode.trim() || undefined,
              avatarUrl: avatarUrl.trim() || undefined,
            }
          : s
      );
    } else {
      // Add new
      const finalCode = code.trim() || getNextStaffCode(branchId, staffList);
      const newStaff: Staff = {
        id: `staff-${Date.now()}`,
        name: name.trim(),
        role: role.trim(),
        branchId,
        category,
        subject: category === "TEACHER" ? subject.trim() : undefined,
        department: category === "STAFF" ? department.trim() : undefined,
        baseSalary: Number(baseSalary) || 0,
        leaveQuota: Number(leaveQuota) || 18,
        leaveUsed: Number(leaveUsed) || 0,
        shiftHours,
        checkInTime,
        checkOutTime,
        phone: phone.trim(),
        email: email.trim() || undefined,
        code: finalCode,
        passcode: passcode.trim() || "1234",
        avatarUrl: avatarUrl.trim() || undefined,
      };
      updated = [newStaff, ...staffList];
      setStaffList(updated);
      saveStaffList(updated);
      if (onStaffUpdated) onStaffUpdated(updated);
      setIsModalOpen(false);
      try {
        soundEffects.playSuccess();
      } catch {}
      // Automatically show the personal code and direct link pass for the new account!
      openStaffPassModal(newStaff);
      return;
    }

    setStaffList(updated);
    saveStaffList(updated);
    if (onStaffUpdated) onStaffUpdated(updated);
    setIsModalOpen(false);
  };

  const handleDeleteStaff = (id: string, staffName: string) => {
    if (id === "admin-user") {
      alert("មិនអាចលុបគណនី Admin របស់អ្នកបានទេ!");
      return;
    }
    if (confirm(`តើអ្នកពិតជាចង់លុបបុគ្គលិក "${staffName}" មែនទេ?`)) {
      const updated = staffList.filter((s) => s.id !== id);
      setStaffList(updated);
      saveStaffList(updated);
      if (onStaffUpdated) onStaffUpdated(updated);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("តើអ្នកចង់ Reset បញ្ជីបុគ្គលិកទៅជាទិន្នន័យគំរូដើមវិញមែនទេ?")) {
      setStaffList(INITIAL_STAFF);
      saveStaffList(INITIAL_STAFF);
      if (onStaffUpdated) onStaffUpdated(INITIAL_STAFF);
    }
  };

  // Helper for iOS Avatar Initials
  const getAvatarInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
    }
    return fullName.slice(0, 2);
  };

  // Filter staff list
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.subject && staff.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (staff.department && staff.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBranch = branchFilter === "ALL" || staff.branchId === branchFilter;

    const staffCat = staff.category || (staff.role.includes("គ្រូ") ? "TEACHER" : "STAFF");
    const matchesCategory = categoryFilter === "ALL" || staffCat === categoryFilter;

    const matchesShift =
      shiftFilter === "ALL" || (staff.shiftHours !== undefined && String(staff.shiftHours) === shiftFilter);

    return matchesSearch && matchesBranch && matchesCategory && matchesShift;
  });

  const teachersCount = staffList.filter(
    (s) => (s.category || (s.role.includes("គ្រូ") ? "TEACHER" : "STAFF")) === "TEACHER"
  ).length;
  const staffCount = staffList.filter(
    (s) => (s.category || (s.role.includes("គ្រូ") ? "TEACHER" : "STAFF")) === "STAFF"
  ).length;

  return (
    <div className="space-y-4 font-kantumruy">
      {/* ========================================================= */}
      {/* 1. iOS STYLE HEADER BAR (CLEAN & MINIMALIST) */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-0.5 p-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 transition shrink-0"
              title="ត្រឡប់ទៅ Home"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Home</span>
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm sm:text-base font-battambang text-slate-900 dark:text-white truncate">
                បុគ្គលិក & តួនាទី
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                {staffList.length} នាក់
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              ៧ សាខា • គ្រប់គ្រងប្រាក់ខែ & កូតាច្បាប់ AI
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold font-battambang transition flex items-center gap-1.5 shadow-sm shadow-blue-600/30 active:scale-95 shrink-0 ml-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ បន្ថែម</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. TOP SEGMENTED CONTROL: STAFF PROFILES vs SALARY TABLE */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/90 dark:bg-slate-800 rounded-3xl text-xs font-battambang shadow-inner">
        <button
          type="button"
          onClick={() => setMainTab("STAFF")}
          className={`py-3 px-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 ${
            mainTab === "STAFF"
              ? "bg-white dark:bg-slate-700 text-blue-600 shadow-md ring-1 ring-black/5"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-xl flex items-center justify-center ${
              mainTab === "STAFF"
                ? "bg-blue-50 text-blue-600"
                : "bg-slate-300 dark:bg-slate-700 text-slate-500"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
          </div>
          <span>👥 បញ្ជីបុគ្គលិក ({staffList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("SALARY")}
          className={`py-3 px-3 rounded-2xl font-bold transition flex items-center justify-center gap-2 ${
            mainTab === "SALARY"
              ? "bg-white dark:bg-slate-700 text-emerald-600 shadow-md ring-1 ring-black/5"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-xl flex items-center justify-center ${
              mainTab === "SALARY"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-300 dark:bg-slate-700 text-slate-500"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <span>💵 តារាងប្រាក់ខែ (Payroll)</span>
        </button>
      </div>

      {mainTab === "SALARY" ? (
        <SalaryManagement
          onStaffUpdated={(newList) => {
            setStaffList(newList);
            if (onStaffUpdated) onStaffUpdated(newList);
          }}
          onOpenAddStaff={openAddModal}
        />
      ) : (
        <>
          {/* ========================================================= */}
          {/* 3. iOS SEGMENTED CONTROL TABS & SEARCH */}
          {/* ========================================================= */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        {/* iOS Segmented Control Tabs */}
        <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter("ALL")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition text-center ${
              categoryFilter === "ALL"
                ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            ទាំងអស់ ({staffList.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("TEACHER")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              categoryFilter === "TEACHER"
                ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>គ្រូ ({teachersCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter("STAFF")}
            className={`flex-1 py-1.5 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
              categoryFilter === "STAFF"
                ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>បុគ្គលិក ({staffCount})</span>
          </button>
        </div>

        {/* iOS Search Bar & View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ស្វែងរកឈ្មោះ, មុខវិជ្ជា, ផ្នែក, ឬតួនាទី..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/80 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Toggle: Cards vs List (Apple style) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("CARD")}
              className={`p-1.5 rounded-xl transition ${
                viewMode === "CARD"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="បែបកាត iOS (Card View)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`p-1.5 rounded-xl transition ${
                viewMode === "LIST"
                  ? "bg-white dark:bg-slate-700 text-blue-600 shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="បែបបញ្ជី iOS (List View)"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Swipeable Branch Chips (1-TAP - NO SELECT DROPDOWN) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setBranchFilter("ALL")}
            className={`px-3 py-1 rounded-xl font-medium whitespace-nowrap transition shrink-0 ${
              branchFilter === "ALL"
                ? "bg-blue-600 text-white font-bold shadow-2xs"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            គ្រប់សាខា ({staffList.length})
          </button>
          {BRANCH_LIST.map((b) => {
            const count = staffList.filter((s) => s.branchId === b.id).length;
            const isSelected = branchFilter === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBranchFilter(b.id)}
                className={`px-3 py-1 rounded-xl font-medium whitespace-nowrap transition shrink-0 flex items-center gap-1 ${
                  isSelected
                    ? "bg-blue-600 text-white font-bold shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isSelected ? "#ffffff" : b.color }}
                />
                <span>{b.nameKhmer} ({count})</span>
              </button>
            );
          })}
        </div>

        {/* Swipeable Shift Chips (1-TAP - NO SELECT DROPDOWN) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShiftFilter("ALL")}
            className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap transition shrink-0 ${
              shiftFilter === "ALL"
                ? "bg-amber-600 text-white font-bold shadow-2xs"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            គ្រប់វេន
          </button>
          {SHIFT_OPTIONS.map((opt) => {
            const isSelected = shiftFilter === String(opt.hours);
            return (
              <button
                key={opt.hours}
                type="button"
                onClick={() => setShiftFilter(String(opt.hours))}
                className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap transition shrink-0 ${
                  isSelected
                    ? "bg-amber-600 text-white font-bold shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {opt.hours} ម៉ោង/ថ្ងៃ
              </button>
            );
          })}

          <button
            onClick={handleResetToDefault}
            className="ml-auto px-2 py-1 text-slate-400 hover:text-slate-600 text-[10px] font-medium flex items-center gap-0.5 shrink-0"
            title="Reset គំរូដើម"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🏛️ SUPER ADMIN BRANCH DIRECTORY EXECUTIVE CARD */}
      {/* ========================================================= */}
      {branchFilter !== "ALL" && (() => {
        const activeBranch = V2_BRANCHES[branchFilter as BranchId];
        if (!activeBranch) return null;
        const branchStaffList = staffList.filter((s) => s.branchId === branchFilter);
        const teachersInBranch = branchStaffList.filter(
          (s) => (s.category || (s.role.includes("គ្រូ") ? "TEACHER" : "STAFF")) === "TEACHER"
        ).length;
        const adminStaffInBranch = branchStaffList.length - teachersInBranch;

        return (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-3xl border border-indigo-800/50 shadow-md space-y-3 animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
                  style={{ backgroundColor: activeBranch.color }}
                >
                  {activeBranch.id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base font-battambang text-white">
                      {activeBranch.nameKhmer}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-indigo-100 font-sans font-bold">
                      {activeBranch.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-200 mt-0.5 line-clamp-1">
                    {activeBranch.addressKhmer}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-center">
              <div className="bg-white/10 p-2 rounded-xl">
                <div className="text-[10px] text-indigo-200">បុគ្គលិកសរុប</div>
                <div className="text-base font-bold font-sans text-white">{branchStaffList.length} នាក់</div>
              </div>
              <div className="bg-white/10 p-2 rounded-xl">
                <div className="text-[10px] text-indigo-200">គ្រូបង្រៀន</div>
                <div className="text-base font-bold font-sans text-amber-300">{teachersInBranch} នាក់</div>
              </div>
              <div className="bg-white/10 p-2 rounded-xl">
                <div className="text-[10px] text-indigo-200">រដ្ឋបាល/ទូទៅ</div>
                <div className="text-base font-bold font-sans text-cyan-300">{adminStaffInBranch} នាក់</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-1.5 text-indigo-200 text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>GPS 100m: {activeBranch.latitude.toFixed(4)}, {activeBranch.longitude.toFixed(4)}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingStaff(null);
                  setName("");
                  setAvatarUrl("");
                  setCategory("TEACHER");
                  setSubject("គណិតវិទ្យា");
                  setDepartment("រដ្ឋបាលសាខា");
                  setRole("គ្រូគណិតវិទ្យា");
                  setBranchId(activeBranch.id);
                  setBaseSalary(500);
                  setLeaveQuota(18);
                  setLeaveUsed(0);
                  setShiftHours(8);
                  setCheckInTime("07:30");
                  setCheckOutTime("17:00");
                  setPhone("");
                  setEmail("");
                  setCode(getNextStaffCode(activeBranch.id, staffList));
                  setPasscode("1234");
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold font-battambang transition shadow-xs flex items-center gap-1 active:scale-95 shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ បន្ថែមក្នុងសាខានេះ</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* 3. STAFF LIST: iOS CARD VIEW (SINGLE FULL-WIDTH COLUMN) */}
      {/* ========================================================= */}
      {viewMode === "CARD" ? (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredStaff.map((staff) => {
            const branch = V2_BRANCHES[staff.branchId];
            const isAdmin = staff.isAdmin || staff.id === "admin-user";
            const isTeacher =
              (staff.category || (staff.role.includes("គ្រូ") ? "TEACHER" : "STAFF")) === "TEACHER";
            const quota = staff.leaveQuota ?? 18;
            const used = staff.leaveUsed ?? 0;
            const remaining = quota - used;
            const shift = staff.shiftHours ?? 8;
            const initials = getAvatarInitials(staff.name);

            return (
              <div
                key={staff.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-md transition active:scale-[0.99] space-y-3 ${
                  isAdmin
                    ? "border-amber-300/80 dark:border-amber-500/60 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/20 to-white dark:from-amber-950/10 dark:to-slate-900"
                    : "border-slate-200/90 dark:border-slate-800"
                }`}
              >
                {/* Top Section: Avatar + Name + Badges + iOS Action Buttons */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* iOS Avatar Circle */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ring-2 ring-white dark:ring-slate-800 shrink-0 overflow-hidden ${
                        isAdmin
                          ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-white"
                          : isTeacher
                          ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                          : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                      }`}
                    >
                      {staff.avatarUrl ? (
                        <img
                          src={staff.avatarUrl}
                          alt={staff.name}
                          className="w-full h-full object-cover"
                        />
                      ) : isAdmin ? (
                        <Crown className="w-5 h-5 text-amber-100" />
                      ) : (
                        initials
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-white font-battambang text-[15px] truncate">
                          {staff.name}
                        </h3>
                        {isAdmin && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5 shrink-0">
                            <Crown className="w-2.5 h-2.5 text-amber-600" />
                            <span>Admin</span>
                          </span>
                        )}
                      </div>

                      {/* iOS Badge Pills */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                            isTeacher
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
                          }`}
                        >
                          {isTeacher ? <GraduationCap className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                          <span>{isTeacher ? `គ្រូ${staff.subject || "បង្រៀន"}` : `ផ្នែក${staff.department || "ទូទៅ"}`}</span>
                        </span>

                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
                          style={{
                            backgroundColor: `${branch?.color}15`,
                            color: branch?.color,
                          }}
                        >
                          {branch?.nameKhmer || staff.branchId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* iOS Style Circular Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => openStaffQrModal(staff)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-950/50 flex items-center justify-center transition active:scale-90"
                      title="មើលកូដ QR វត្តមាន"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(staff)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-blue-950/50 flex items-center justify-center transition active:scale-90"
                      title="កែសម្រួលទាំងអស់"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!isAdmin && (
                      <button
                        onClick={() => handleDeleteStaff(staff.id, staff.name)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/50 flex items-center justify-center transition active:scale-90"
                        title="លុបបុគ្គលិក"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Role Row (Quick-Edit Button) */}
                <button
                  type="button"
                  onClick={() => openQuickRoleModal(staff)}
                  className="w-full flex items-center justify-between p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-left transition group/role"
                  title="ចុចដើម្បីវាយប្តូរតួនាទីរហ័ស"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {staff.role}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-white dark:bg-slate-700 px-2.5 py-0.5 rounded-lg shadow-2xs group-hover/role:bg-blue-600 group-hover/role:text-white transition shrink-0 flex items-center gap-1">
                    <Edit2 className="w-2.5 h-2.5" />
                    <span>កែតួនាទី</span>
                  </span>
                </button>

                {/* 2 iOS Metric Blocks (Salary & Shift Hours) */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {/* Salary Block */}
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 p-2.5 rounded-2xl">
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>ប្រាក់ខែគោល</span>
                    </div>
                    <div className="font-bold text-emerald-900 dark:text-emerald-200 font-mono text-sm mt-0.5">
                      ${staff.baseSalary ?? 500} / ខែ
                    </div>
                  </div>

                  {/* Shift Hours Block */}
                  <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 p-2.5 rounded-2xl">
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>វេលាធ្វើការ</span>
                    </div>
                    <div className="font-bold text-amber-900 dark:text-amber-200 text-sm mt-0.5">
                      {shift} ម៉ោង/ថ្ងៃ
                    </div>
                  </div>
                </div>

                {/* iOS Inset Grouped Info Box (Schedule & AI Quota & Phone) */}
                <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-2xl space-y-2 text-xs border border-slate-100 dark:border-slate-800">
                  {/* Shift Schedule */}
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>ម៉ោងកំណត់៖</span>
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 whitespace-nowrap bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md shadow-2xs">
                      {staff.checkInTime} - {staff.checkOutTime}
                    </span>
                  </div>

                  {/* AI Leave Quota Balance & Progress Bar */}
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Bot className="w-3.5 h-3.5 text-purple-500" />
                        <span>កូតាច្បាប់ AI៖</span>
                      </span>
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                        កូតា: {quota} | ប្រើ: {used} |{" "}
                        <span className={remaining < 0 ? "text-rose-500 font-black" : "text-emerald-600"}>
                          សល់: {remaining} ថ្ងៃ
                        </span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200/70 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-purple-600 h-full transition-all"
                        style={{ width: `${Math.min(100, (used / quota) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Phone number */}
                  {staff.phone && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>ទូរស័ព្ទ៖</span>
                      </span>
                      <a
                        href={`tel:${staff.phone}`}
                        className="font-mono font-bold text-blue-600 hover:underline text-xs flex items-center gap-1"
                      >
                        {staff.phone}
                      </a>
                    </div>
                  )}

                  {/* Staff Login Credentials & Direct Access Link */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 p-2.5 rounded-2xl">
                    <div className="min-w-0 pr-2">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium flex-wrap">
                        <KeyRound className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>កូដចូល៖</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-md">
                          {staff.code || staff.id}
                        </span>
                        <span>• PIN:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {staff.passcode || "1234"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate font-mono">
                        ?code={staff.code || staff.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openStaffPassModal(staff)}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition bg-amber-500 hover:bg-amber-600 text-white shadow-2xs active:scale-95"
                        title="ចែករំលែកប័ណ្ណគណនី & Link ផ្ទាល់ខ្លួន"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ចែករំលែកកូដ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyStaffLink(staff)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition shadow-2xs active:scale-95 ${
                          copiedStaffId === staff.id
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        }`}
                        title="ចម្លង Link ផ្ទាល់សម្រាប់បុគ្គលិកនេះ"
                      >
                        {copiedStaffId === staff.id ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>បានចម្លង!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>ចម្លង Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================= */
        /* 4. STAFF LIST: iOS COMPACT CONTACTS LIST VIEW */
        /* ========================================================= */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
          {filteredStaff.map((staff) => {
            const branch = V2_BRANCHES[staff.branchId];
            const isAdmin = staff.isAdmin || staff.id === "admin-user";
            const initials = getAvatarInitials(staff.name);

            return (
              <div
                key={staff.id}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-xs shrink-0 overflow-hidden ${
                      isAdmin
                        ? "bg-amber-500 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {staff.avatarUrl ? (
                      <img
                        src={staff.avatarUrl}
                        alt={staff.name}
                        className="w-full h-full object-cover"
                      />
                    ) : isAdmin ? (
                      <Crown className="w-4 h-4 text-amber-100" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white font-battambang truncate">
                        {staff.name}
                      </span>
                      {isAdmin && (
                        <span className="text-[9px] font-bold px-1 rounded-sm bg-amber-100 text-amber-800">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{staff.role}</span>
                      <span>•</span>
                      <span style={{ color: branch?.color }}>{branch?.nameKhmer}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openStaffPassModal(staff)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
                    title="ចែករំលែកប័ណ្ណគណនី & Link ផ្ទាល់ខ្លួន"
                  >
                    <Share2 className="w-4 h-4 text-amber-500" />
                  </button>
                  <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-xl">
                    ${staff.baseSalary ?? 500}
                  </span>
                  <button
                    onClick={() => openEditModal(staff)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredStaff.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">មិនមានបុគ្គលិកត្រូវតាមការស្វែងរកឡើយ</p>
        </div>
      )}
        </>
      )}

      {/* ========================================================= */}
      {/* 5. QUICK ROLE EDIT MODAL (iOS SHEET STYLE) */}
      {/* ========================================================= */}
      {quickRoleStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold font-battambang text-slate-800 dark:text-white text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>វាយកំណត់តួនាទីបុគ្គលិក</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  សម្រាប់៖ <b className="text-slate-800 dark:text-slate-200">{quickRoleStaff.name}</b> ({V2_BRANCHES[quickRoleStaff.branchId]?.nameKhmer})
                </p>
              </div>
              <button
                onClick={() => setQuickRoleStaff(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 font-battambang">
                  វាយបញ្ចូលតួនាទីថ្មីដោយសេរី (Type Custom Role)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={quickRoleInput}
                    onChange={(e) => setQuickRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveQuickRole();
                      }
                    }}
                    placeholder="ឧ. គ្រូគណិតវិទ្យា, ប្រធានសាខា, CEO, រដ្ឋបាល,..."
                    className="w-full text-xs font-semibold px-3.5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden shadow-inner"
                  />
                  {quickRoleInput && (
                    <button
                      type="button"
                      onClick={() => setQuickRoleInput("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickRoleStaff(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition"
                >
                  បោះបង់
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickRole}
                  disabled={!quickRoleInput.trim()}
                  className="px-5 py-2.5 text-xs font-bold font-battambang bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>រក្សាទុកតួនាទី</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. ADD / EDIT STAFF MODAL (100% DROPDOWN-FREE) */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 font-kantumruy">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-battambang text-slate-900 dark:text-white text-base">
                    {editingStaff ? "កែសម្រួលព័ត៌មានបុគ្គលិក" : "បញ្ចូលបុគ្គលិកថ្មី"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    បញ្ចូលព័ត៌មានងាយស្រួល វាយបញ្ចូលផ្ទាល់ ឬចុច ១-Tap គ្មាន Dropdown ពិបាក
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStaff} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* SECTION 1: CATEGORY & BRANCH */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-battambang">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-[11px]">១</span>
                  <span>ប្រភេទបុគ្គលិក & សាខាប្រចាំការ</span>
                </div>

                {/* Category Toggle Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("TEACHER");
                      setRole(`គ្រូ${subject}`);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                      category === "TEACHER"
                        ? "bg-blue-50 border-blue-600 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${category === "TEACHER" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs font-battambang">👨‍🏫 គ្រូបង្រៀន (Teacher)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">បែងចែកតាមមុខវិជ្ជា</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategory("STAFF");
                      setRole(department);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                      category === "STAFF"
                        ? "bg-indigo-50 border-indigo-600 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${category === "STAFF" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs font-battambang">🏢 បុគ្គលិកទូទៅ (Staff)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">បែងចែកតាមផ្នែក</div>
                    </div>
                  </button>
                </div>

                {/* 1-Tap Branch Selector (NO SELECT DROPDOWN) */}
                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>ជ្រើសរើសសាខា (ចុច ១-Tap ជ្រើសរើស):</span>
                    <span className="text-blue-600 font-bold">{V2_BRANCHES[branchId]?.nameKhmer}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {BRANCH_LIST.map((b) => {
                      const isSelected = branchId === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setBranchId(b.id);
                            if (!editingStaff) {
                              setCode(getNextStaffCode(b.id, staffList));
                            }
                          }}
                          className={`p-2 rounded-xl border text-left transition text-xs flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 font-bold shadow-xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="truncate">{b.nameKhmer}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 2: SUBJECT / DEPARTMENT (DIRECT INPUT + CHIPS - NO SELECT) */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-battambang">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-[11px]">២</span>
                  <span>{category === "TEACHER" ? "មុខវិជ្ជាបង្រៀន" : "ផ្នែក / ដេប៉ាតឺម៉ង់"}</span>
                </div>

                {category === "TEACHER" ? (
                  <div>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        if (!editingStaff) setRole(`គ្រូ${e.target.value}`);
                      }}
                      placeholder="វាយបញ្ចូលមុខវិជ្ជា ឧ. គណិតវិទ្យា, រូបវិទ្យា..."
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {TEACHER_SUBJECTS.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            setSubject(sub);
                            if (!editingStaff) setRole(`គ្រូ${sub}`);
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-xl border transition font-medium ${
                            subject === sub
                              ? "bg-blue-600 text-white border-blue-600 font-bold shadow-2xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        if (!editingStaff) setRole(e.target.value);
                      }}
                      placeholder="វាយបញ្ចូលផ្នែក ឧ. រដ្ឋបាលសាខា, គណនេយ្យ & ហិរញ្ញវត្ថុ, IT..."
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {STAFF_DEPARTMENTS.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            setDepartment(dept);
                            if (!editingStaff) setRole(dept);
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-xl border transition font-medium ${
                            department === dept
                              ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: STAFF PHOTO & PERSONAL INFO */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-battambang">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-[11px]">៣</span>
                    <span>រូបថត & ព័ត៌មានផ្ទាល់ខ្លួន</span>
                  </div>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold"
                    >
                      លុបរូបថតចេញ
                    </button>
                  )}
                </div>

                {/* Profile Photo Uploader & Presets */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center gap-3.5">
                    {/* Photo Avatar Preview */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 border-2 border-white dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 overflow-hidden">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Staff Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-1">
                            <ImageIcon className="w-6 h-6 mx-auto text-slate-400 mb-0.5" />
                            <span className="text-[9px] text-slate-400 font-semibold block leading-tight">គ្មានរូបថត</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md transition active:scale-95"
                        title="ជ្រើសរើសរូបថត"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Upload button & details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>បញ្ចូលរូបភាពបុគ្គលិក</span>
                      </button>
                      <p className="text-[10px] text-slate-400">
                        ជ្រើសរូបពីទូរស័ព្ទ ឬកុំព្យូទ័រ (JPG, PNG) • ប្រព័ន្ធបង្រួមទំហំស្វ័យប្រវត្តិ
                      </p>
                    </div>
                  </div>

                  {/* Preset Avatars Selection */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                      ឬជ្រើសរើសរូបតំណាងគំរូ (Presets)៖
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_AVATARS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset);
                            try {
                              soundEffects?.playClick?.();
                            } catch {}
                          }}
                          className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition active:scale-90 ${
                            avatarUrl === preset
                              ? "border-blue-600 ring-2 ring-blue-500/40 shadow-xs"
                              : "border-transparent opacity-75 hover:opacity-100 hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={preset}
                            alt={`Preset ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      ឈ្មោះបុគ្គលិក <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. កែវ ឧត្តម"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      តួនាទីជាក់ស្តែង <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. គ្រូគណិតវិទ្យា, ប្រធានសាខា"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      លេខទូរស័ព្ទ (Phone Number)
                    </label>
                    <input
                      type="tel"
                      placeholder="012 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      អ៊ីមែលផ្ទាល់ខ្លួនប្រចាំថ្ងៃ (Personal Email / Gmail)
                    </label>
                    <input
                      type="email"
                      placeholder="ឧ. yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: SALARY & AI LEAVE QUOTA */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-battambang">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-[11px]">៤</span>
                  <span>ប្រាក់ខែ និងកូតាច្បាប់ AI</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        ប្រាក់ខែគោល (USD $)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          required
                          value={baseSalary}
                          onChange={(e) => setBaseSalary(Number(e.target.value))}
                          className="w-full text-xs pl-7 pr-3 py-2.5 font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        កូតាច្បាប់ (ថ្ងៃ/ឆ្នាំ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={leaveQuota}
                        onChange={(e) => setLeaveQuota(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2.5 font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        បានឈប់រួច (ថ្ងៃ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={leaveUsed}
                        onChange={(e) => setLeaveUsed(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2.5 font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 p-2.5 rounded-xl flex items-center justify-between border border-purple-200/50 dark:border-purple-900/40">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Bot className="w-3.5 h-3.5 text-purple-600" />
                      <span>សមតុល្យច្បាប់ AI នៅសល់៖</span>
                    </span>
                    <span className="font-bold font-mono text-sm">
                      {leaveQuota - leaveUsed} ថ្ងៃ
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: SHIFT HOURS (២, ៤, ៦, ៨, ១២.៥ ម៉ោង) */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-battambang">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-[11px]">៥</span>
                    <span>វេលាធ្វើការ (ចុច ១-Tap ជ្រើសរើស)</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600 font-mono">
                    {shiftHours} ម៉ោងក្នុងមួយថ្ងៃ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SHIFT_OPTIONS.map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => handleShiftSelect(opt.hours)}
                      className={`p-2.5 rounded-2xl border text-center transition font-semibold text-xs ${
                        shiftHours === opt.hours
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-bold text-xs">{opt.hours} ម៉ោង</div>
                      <div className="text-[10px] opacity-80 mt-0.5 font-mono">
                        {opt.defaultIn}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Shift Check-in & Check-out inputs */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      ម៉ោងចូល (Shift In)
                    </label>
                    <input
                      type="time"
                      required
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      ម៉ោងចេញ (Shift Out)
                    </label>
                    <input
                      type="time"
                      required
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: LOGIN ACCESS CODE & PIN */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 font-battambang">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center text-[11px]">៦</span>
                    <span>លេខកូដចូលប្រើ & លេខសម្ងាត់ PIN (សម្រាប់បុគ្គលិក)</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    🔒 សិទ្ធិផ្ទាល់ខ្លួន
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      លេខកូដសម្គាល់បុគ្គលិក (Staff Code)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. V2-BKK01"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                      លេខសម្ងាត់ PIN (Passcode)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. 1234"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  * បុគ្គលិកអាចចូលប្រើតាមរយៈ Link តែមួយ ដោយប្រើកូដ ឬ Link <code>?code={code || "..."}</code> ។ គាត់នឹងមានសិទ្ធិត្រឹមតែស្កេនវត្តមាន និងមើលទិន្នន័យផ្ទាល់ខ្លួនប៉ុណ្ណោះ មិនអាចមើលឃើញប្រាក់ខែ ឬព័ត៌មានផ្ទៃក្នុងសាលាឡើយ។
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold font-battambang bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingStaff ? "រក្សាទុកការកែប្រែ" : "បន្ថែមបុគ្គលិកថ្មី"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. STAFF QR BADGE MODAL */}
      {/* ========================================================= */}
      {qrModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden font-kantumruy">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-battambang text-slate-800 dark:text-white">
                    ប័ណ្ណកូដ QR វត្តមាន
                  </h3>
                  <p className="text-[11px] text-slate-400">Staff Attendance QR Badge</p>
                </div>
              </div>
              <button
                onClick={() => setQrModalStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 inline-block shadow-inner">
                {staffQrDataUrl ? (
                  <Image
                    src={staffQrDataUrl}
                    alt={qrModalStaff.name}
                    width={220}
                    height={220}
                    className="rounded-xl mx-auto"
                    unoptimized
                  />
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center text-xs text-slate-400">
                    កំពុងបង្កើត QR...
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-base font-battambang text-slate-900 dark:text-white">
                  {qrModalStaff.name}
                </h4>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  {qrModalStaff.role}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  សាខា: {V2_BRANCHES[qrModalStaff.branchId]?.nameKhmer} • វេន: {qrModalStaff.shiftHours || 8} ម៉ោង/ថ្ងៃ
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300">
                💡 បង្ហាញកូដ QR នេះទៅកាន់កាមេរ៉ាស្កេនដើម្បីកត់ត្រាវត្តមានភ្លាមៗ
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadStaffQr}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ទាញយក PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalStaff(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition"
                >
                  បិទ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. STAFF ACCOUNT PASS & PERSONAL LINK MODAL */}
      {/* ========================================================= */}
      {passModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-kantumruy">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800/60 dark:to-indigo-950/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-battambang text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>ប័ណ្ណគណនី & Link ផ្ទាល់ខ្លួន</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    សម្រាប់ប្រគល់ជូនបុគ្គលិកចូលប្រើប្រាស់ផ្ទាល់ខ្លួន
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPassModalStaff(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Staff Profile Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white dark:ring-slate-700 shadow-xs">
                  {passModalStaff.avatarUrl ? (
                    <img
                      src={passModalStaff.avatarUrl}
                      alt={passModalStaff.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    passModalStaff.name.slice(0, 2)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-base font-battambang text-slate-900 dark:text-white truncate">
                    {passModalStaff.name}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate">
                    {passModalStaff.role}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {V2_BRANCHES[passModalStaff.branchId]?.nameKhmer || passModalStaff.branchId} • {passModalStaff.shiftHours || 8} ម៉ោង/ថ្ងៃ
                  </div>
                  {(passModalStaff.email || passModalStaff.phone) && (
                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-2 mt-0.5 font-mono">
                      {passModalStaff.phone && <span>📱 {passModalStaff.phone}</span>}
                      {passModalStaff.email && <span>✉️ {passModalStaff.email}</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Box 1: Personal Code (លេខកូដផ្ទាល់ខ្លួន) */}
              <div className="bg-amber-50/60 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 font-battambang flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>លេខកូដសម្គាល់ផ្ទាល់ខ្លួន (Personal Code)</span>
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">
                    សម្រាប់វាយចូលក្នុងប្រព័ន្ធ
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-amber-300/80 dark:border-amber-700/60 font-mono font-bold text-base text-slate-900 dark:text-white tracking-wider text-center">
                    {passModalStaff.code || passModalStaff.id}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(passModalStaff.code || passModalStaff.id);
                      setCopiedPassCode(true);
                      setTimeout(() => setCopiedPassCode(false), 2000);
                    }}
                    className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-2xs active:scale-95"
                  >
                    {copiedPassCode ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>បានចម្លង</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>ចម្លងកូដ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Box 2: Direct Login Link (Link ផ្ទាល់ខ្លួន) */}
              <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 font-battambang flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Link ចូលប្រើប្រាស់ផ្ទាល់ខ្លួន (Direct Link)</span>
                  </span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-400">
                    ចុចចូលភ្លាមដោយស្វ័យប្រវត្តិ
                  </span>
                </div>

                <div className="text-[11px] font-mono p-2 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 text-slate-700 dark:text-slate-300 break-all select-all">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/?code=${encodeURIComponent(passModalStaff.code || passModalStaff.id)}`
                    : `/?code=${passModalStaff.code || passModalStaff.id}`}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const link = `${window.location.origin}/?code=${encodeURIComponent(passModalStaff.code || passModalStaff.id)}`;
                      navigator.clipboard.writeText(link);
                      setCopiedPassLink(true);
                      setTimeout(() => setCopiedPassLink(false), 2000);
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    {copiedPassLink ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>បានចម្លង Link រួចរាល់!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>ចម្លង Link ផ្ញើទៅបុគ្គលិក</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const origin = window.location.origin;
                      const link = `${origin}/?code=${encodeURIComponent(passModalStaff.code || passModalStaff.id)}`;
                      const msg = `សួស្តី ${passModalStaff.name}! នេះជាព័ត៌មានគណនីវត្តមាន V2 Education របស់អ្នក៖\n- លេខកូដសម្គាល់ផ្ទាល់ខ្លួន៖ ${passModalStaff.code || passModalStaff.id}\n- Link ចូលប្រើប្រាស់ផ្ទាល់ខ្លួន៖ ${link}\n\nសូមចុចលើ Link ខាងលើដើម្បីចូលស្កេនវត្តមានភ្លាមៗ។`;
                      navigator.clipboard.writeText(msg);
                      setCopiedPassText(true);
                      setTimeout(() => setCopiedPassText(false), 2500);
                    }}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                    title="ចម្លងសារព័ត៌មានពេញលេញ"
                  >
                    {copiedPassText ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>បានចម្លងសារ</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>ចម្លងសារផ្ញើ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QR Code Quick Scan Display */}
              {passQrDataUrl && (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
                  <img
                    src={passQrDataUrl}
                    alt="Direct Link QR"
                    className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 shrink-0"
                  />
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200 font-battambang">
                      កូដ QR សម្រាប់ស្កេនចូលភ្លាមៗ
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      បុគ្គលិកអាចយកទូរស័ព្ទបើកកាមេរ៉ាស្កេនលើ QR នេះ ដើម្បីចូលគណនីភ្លាមៗដោយមិនបាច់វាយកូដ។
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <a
                href={`/?code=${encodeURIComponent(passModalStaff.code || passModalStaff.id)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>សាកល្បងបើកគណនីនេះ</span>
              </a>

              <button
                type="button"
                onClick={() => setPassModalStaff(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
              >
                រួចរាល់
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
