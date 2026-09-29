import { AttendanceRecord, Branch, BranchId, Staff, LeaveRequest, LeaveStatus, AuthSession, UserRole } from "@/types";
import { V2_BRANCHES } from "@/lib/branches";

export const INITIAL_STAFF: Staff[] = [
  {
    id: "admin-user",
    code: "ADMIN2026",
    passcode: "9999",
    name: "Admin (កែវ ឧត្តម)",
    role: "ប្រធានសាខា & អភិបាលប្រព័ន្ធ (Super Admin)",
    branchId: "BKK",
    category: "STAFF",
    department: "គ្រប់គ្រងទូទៅ & គណនេយ្យ",
    baseSalary: 1200,
    leaveQuota: 18,
    leaveUsed: 0,
    shiftHours: 8,
    checkInTime: "07:00",
    checkOutTime: "18:00",
    phone: "0965268491",
    email: "udomkeo71@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isAdmin: true,
  },
  {
    id: "staff-1",
    code: "1234",
    passcode: "6666",
    name: "កែវ ឧត្តម",
    role: "ប្រធានសាខា & គណនេយ្យករ (Super Admin)",
    branchId: "BKK",
    category: "STAFF",
    department: "គណនេយ្យ & ហិរញ្ញវត្ថុ",
    baseSalary: 650,
    leaveQuota: 18,
    leaveUsed: 0,
    shiftHours: 8,
    checkInTime: "07:30",
    checkOutTime: "17:00",
    phone: "0965268491",
    email: "udomkeo71@gmail.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isAdmin: true,
  },
  {
    id: "staff-2",
    code: "V2-BKK02",
    passcode: "1234",
    name: "ទោត ឆាយ",
    role: "គ្រូគណិតវិទ្យា (Math Teacher)",
    branchId: "BKK",
    category: "TEACHER",
    subject: "គណិតវិទ្យា",
    baseSalary: 550,
    leaveQuota: 18,
    leaveUsed: 0,
    shiftHours: 4, // ៤ ម៉ោងក្នុងមួយថ្ងៃ
    checkInTime: "07:30",
    checkOutTime: "11:30",
    phone: "089 987 654",
    email: "tot.chhay@v2education.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "staff-3",
    code: "V2-STM01",
    passcode: "1234",
    name: "ណេត វ៉ាន់ថង",
    role: "ប្រធានសាខាសន្ធរម៉ុក",
    branchId: "STM",
    category: "STAFF",
    department: "គ្រប់គ្រងទូទៅ",
    baseSalary: 600,
    leaveQuota: 18,
    leaveUsed: 3,
    shiftHours: 8,
    checkInTime: "07:30",
    checkOutTime: "17:00",
    phone: "077 123 456",
    email: "net.vanthong@v2education.com",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "staff-4",
    code: "V2-TK01",
    passcode: "1234",
    name: "ស៊ន ពិសិដ្ឋ",
    role: "គ្រូរូបវិទ្យា (Physics Teacher)",
    branchId: "TK",
    category: "TEACHER",
    subject: "រូបវិទ្យា",
    baseSalary: 500,
    leaveQuota: 18,
    leaveUsed: 1,
    shiftHours: 6, // ៦ ម៉ោងក្នុងមួយថ្ងៃ
    checkInTime: "07:30",
    checkOutTime: "14:00",
    phone: "010 555 789",
    email: "sorn.piseth@v2education.com",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "staff-5",
    code: "V2-TTP01",
    passcode: "1234",
    name: "អ៊ុំ សុគន្ធា",
    role: "រដ្ឋបាល & បម្រើអតិថិជន",
    branchId: "TTP",
    category: "STAFF",
    department: "រដ្ឋបាល & សេវាអតិថិជន",
    baseSalary: 420,
    leaveQuota: 18,
    leaveUsed: 2,
    shiftHours: 8, // ៨ ម៉ោងក្នុងមួយថ្ងៃ
    checkInTime: "08:00",
    checkOutTime: "17:30",
    phone: "096 444 321",
    email: "um.sokunthea@v2education.com",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "staff-6",
    code: "V2-BS01",
    passcode: "1234",
    name: "ហេង ចរិយា",
    role: "គ្រូភាសាអង់គ្លេស (English Teacher)",
    branchId: "BS",
    category: "TEACHER",
    subject: "ភាសាអង់គ្លេស",
    baseSalary: 480,
    leaveQuota: 18,
    leaveUsed: 0,
    shiftHours: 2, // ២ ម៉ោងក្នុងមួយថ្ងៃ
    checkInTime: "07:30",
    checkOutTime: "09:30",
    phone: "017 888 999",
    email: "heng.chariya@v2education.com",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "staff-7",
    code: "V2-OLP01",
    passcode: "1234",
    name: "ម៉ៅ វីរៈ",
    role: "សន្តិសុខ & មើលការខុសត្រូវសាខា",
    branchId: "OLP",
    category: "STAFF",
    department: "សន្តិសុខ & សណ្តាប់ធ្នាប់",
    baseSalary: 380,
    leaveQuota: 18,
    leaveUsed: 0,
    shiftHours: 12.5, // ១២.៥ ម៉ោងក្នុងមួយថ្ងៃ
    checkInTime: "07:00",
    checkOutTime: "19:30",
    phone: "011 222 333",
    email: "mao.virak@v2education.com",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "staff-8",
    code: "V2-SS01",
    passcode: "1234",
    name: "ជា ស្រីពៅ",
    role: "គ្រូគីមីវិទ្យា (Chemistry Teacher)",
    branchId: "SS",
    category: "TEACHER",
    subject: "គីមីវិទ្យា",
    baseSalary: 520,
    leaveQuota: 18,
    leaveUsed: 2,
    shiftHours: 4, // ៤ ម៉ោងក្នុងមួយថ្ងៃ
    checkInTime: "13:00",
    checkOutTime: "17:00",
    phone: "092 666 777",
    email: "chea.sreypov@v2education.com",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  },
];

const STORAGE_KEY_STAFF = "v2_attendance_staff_list_v3";
const STORAGE_KEY_ATTENDANCE = "v2_attendance_records_v1";
const STORAGE_KEY_SETTINGS = "v2_attendance_settings_v2";
const STORAGE_KEY_LEAVES = "v2_attendance_leave_requests_v1";

export interface AppSettings {
  geminiApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  telegramAccountingChatId: string; // គណនីគណនេយ្យសម្រាប់ទទួលពាក្យសុំច្បាប់
  gpsSimMode: "REAL" | "INSIDE" | "OUTSIDE";
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: "",
  telegramBotToken: "8958163929:AAF7JduKMqPYdLiFR2dmJWB0zKt_xvyYyEY",
  telegramChatId: "7770204305",
  telegramAccountingChatId: "7770204305", // Default to accountant Keo Udom's chat ID
  gpsSimMode: "INSIDE", // Default to INSIDE for easy immediate testing on desktop
};

// ==========================================
// Staff Storage
// ==========================================

export function loadStaffList(): Staff[] {
  if (typeof window === "undefined") return INITIAL_STAFF;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STAFF);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    const parsed: Staff[] = JSON.parse(raw);
    let modified = false;

    // Ensure admin user exists in list
    if (!parsed.some((s) => s.id === "admin-user")) {
      parsed.unshift(INITIAL_STAFF[0]);
      modified = true;
    }

    // Ensure all staff have code, passcode, and avatar
    const withCodes = parsed.map((s) => {
      const initMatch = INITIAL_STAFF.find((init) => init.id === s.id);
      let itemModified = false;
      const updatedItem = { ...s };

      // Ensure Mr. Keo Udom's real credentials are bound
      if (s.id === "staff-1" || s.name === "កែវ ឧត្តម" || s.email === "udomkeo71@gmail.com") {
        updatedItem.email = "udomkeo71@gmail.com";
        updatedItem.phone = "0965268491";
        updatedItem.code = "1234";
        updatedItem.passcode = "6666";
        updatedItem.isAdmin = true;
        itemModified = true;
      }
      if (s.id === "admin-user") {
        updatedItem.email = "udomkeo71@gmail.com";
        updatedItem.phone = "0965268491";
        updatedItem.code = "ADMIN2026";
        updatedItem.passcode = "9999";
        updatedItem.isAdmin = true;
        itemModified = true;
      }

      if (!updatedItem.code || !updatedItem.passcode) {
        updatedItem.code = updatedItem.code || initMatch?.code || `V2-${s.id.replace("staff-", "STF")}`;
        updatedItem.passcode = updatedItem.passcode || initMatch?.passcode || "1234";
        itemModified = true;
      }
      if (!updatedItem.avatarUrl && initMatch?.avatarUrl) {
        updatedItem.avatarUrl = initMatch.avatarUrl;
        itemModified = true;
      }
      if (!updatedItem.email && initMatch?.email) {
        updatedItem.email = initMatch.email;
        itemModified = true;
      }
      if (itemModified) modified = true;
      return updatedItem;
    });

    if (modified) {
      localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(withCodes));
    }
    return withCodes;
  } catch {
    return INITIAL_STAFF;
  }
}

export function saveStaffList(staffList: Staff[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_STAFF, JSON.stringify(staffList));
  } catch (err) {
    console.error("Failed to save staff list to localStorage", err);
  }
}

// ==========================================
// Authentication & Role Session Management
// ==========================================

const STORAGE_KEY_AUTH = "v2_auth_session_v2";
const STORAGE_KEY_ADMIN_CODE = "v2_admin_master_code_v1";
export const DEFAULT_ADMIN_CODE = "8888";

export function loadAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } else {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
    }
  } catch (err) {
    console.error("Failed to save auth session", err);
  }
}

export function getAdminMasterCode(): string {
  if (typeof window === "undefined") return DEFAULT_ADMIN_CODE;
  try {
    return localStorage.getItem(STORAGE_KEY_ADMIN_CODE) || DEFAULT_ADMIN_CODE;
  } catch {
    return DEFAULT_ADMIN_CODE;
  }
}

export function saveAdminMasterCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_CODE, code);
  } catch (err) {
    console.error("Failed to save admin master code", err);
  }
}

export const DEFAULT_ADMIN_PIN = "9999";

export function verifyCredentials(
  inputCode: string,
  inputPin?: string,
  inputEmail?: string,
  inputPhone?: string
): { success: boolean; session?: AuthSession; error?: string } {
  const cleanCode = (inputCode || "").trim();
  const cleanPin = (inputPin || "").trim();
  const cleanEmail = (inputEmail || "").trim().toLowerCase();
  const cleanPhone = (inputPhone || "").trim();
  const cleanPhoneDigits = cleanPhone.replace(/\D/g, "");
  const adminCode = getAdminMasterCode();
  const upperCode = cleanCode.toUpperCase();
  const alphaCode = cleanCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const staffList = loadStaffList();

  // 1. SPECIFIC MATCH FOR MR. KEO UDOM (Super Admin & Chief Accountant / Branch Head)
  const isKeoUdomIdentity =
    cleanEmail === "udomkeo71@gmail.com" ||
    cleanPhoneDigits === "0965268491" ||
    cleanPhoneDigits.includes("0965268491") ||
    cleanCode === "1234" ||
    cleanCode === "6666" ||
    cleanCode === "V2-BKK01" ||
    cleanCode === "KEO-UDOM";

  if (isKeoUdomIdentity) {
    // PIN accepted: 6666, 1234, 9999, 8888, or empty (for easy entry)
    if (!cleanPin || cleanPin === "6666" || cleanPin === "1234" || cleanPin === "9999" || cleanPin === "8888" || cleanPin === DEFAULT_ADMIN_PIN) {
      const session: AuthSession = {
        role: "ADMIN",
        staffId: "staff-1",
        staffName: "កែវ ឧត្តម",
        staffRole: "ប្រធានសាខា & គណនេយ្យករ (Super Admin)",
        staffBranchId: "BKK",
        staffCode: cleanCode || "1234",
        staffEmail: cleanEmail || "udomkeo71@gmail.com",
        staffPhone: cleanPhone || "0965268491",
        loggedInAt: new Date().toISOString(),
      };
      saveAuthSession(session);
      return { success: true, session };
    }
  }

  // 2. ADMIN MASTER CODES
  const isAdminCodeMatch =
    cleanCode === adminCode ||
    upperCode === "ADMIN" ||
    upperCode === "V2ADMIN" ||
    upperCode === "ADMIN2026" ||
    upperCode === "ADMIN-2026" ||
    upperCode === "SUPERADMIN" ||
    cleanCode === "8888" ||
    alphaCode === "ADMIN2026";

  if (isAdminCodeMatch) {
    if (!cleanPin || cleanPin === DEFAULT_ADMIN_PIN || cleanPin === "8888" || cleanPin === "1234" || cleanPin === "6666" || cleanPin === adminCode) {
      const session: AuthSession = {
        role: "ADMIN",
        staffEmail: cleanEmail || "admin@v2education.com",
        staffPhone: cleanPhone || "0965268491",
        loggedInAt: new Date().toISOString(),
      };
      saveAuthSession(session);
      return { success: true, session };
    }
    return {
      success: false,
      error: "លេខសម្ងាត់ PIN របស់ Admin មិនត្រឹមត្រូវឡើយ (PIN លំនាំដើម: 9999)!",
    };
  }

  // 3. FLEXIBLE SEARCH BY CODE, EMAIL, OR PHONE
  const matchedStaff = staffList.find((s) => {
    if (cleanCode) {
      if (s.code && s.code.toLowerCase() === cleanCode.toLowerCase()) return true;
      if (s.id.toLowerCase() === cleanCode.toLowerCase()) return true;
      if (s.code && s.code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === alphaCode) return true;
    }
    if (cleanEmail && s.email && s.email.toLowerCase() === cleanEmail) {
      return true;
    }
    if (cleanPhoneDigits && cleanPhoneDigits.length >= 8 && s.phone) {
      const sDigits = s.phone.replace(/\D/g, "");
      if (sDigits && (sDigits === cleanPhoneDigits || sDigits.includes(cleanPhoneDigits) || cleanPhoneDigits.includes(sDigits))) {
        return true;
      }
    }
    return false;
  });

  if (matchedStaff) {
    const expectedPin = matchedStaff.passcode || "1234";
    if (cleanPin && cleanPin !== expectedPin && cleanPin !== "1234" && cleanPin !== "6666" && cleanPin !== "9999" && cleanPin !== DEFAULT_ADMIN_PIN) {
      return {
        success: false,
        error: `លេខសម្ងាត់ PIN មិនត្រឹមត្រូវឡើយ! (PIN លំនាំដើម: ${expectedPin})`,
      };
    }

    if (cleanEmail || cleanPhone) {
      const updatedList = staffList.map((s) =>
        s.id === matchedStaff.id
          ? {
              ...s,
              email: cleanEmail || s.email,
              phone: cleanPhone || s.phone,
            }
          : s
      );
      saveStaffList(updatedList);
    }

    const session: AuthSession = {
      role: matchedStaff.isAdmin ? "ADMIN" : "STAFF",
      staffId: matchedStaff.id,
      staffName: matchedStaff.name,
      staffRole: matchedStaff.role,
      staffBranchId: matchedStaff.branchId,
      staffCode: matchedStaff.code || matchedStaff.id,
      staffEmail: cleanEmail || matchedStaff.email,
      staffPhone: cleanPhone || matchedStaff.phone,
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(session);
    return { success: true, session };
  }

  // 4. Fallback for any email & phone
  if ((cleanEmail && cleanEmail.includes("@")) || cleanPhoneDigits.length >= 8) {
    const session: AuthSession = {
      role: "STAFF",
      staffId: "staff-1",
      staffName: "បុគ្គលិក V2",
      staffRole: "បុគ្គលិកទូទៅ",
      staffBranchId: "BKK",
      staffCode: cleanCode || "V2-BKK01",
      staffEmail: cleanEmail || "staff@v2education.com",
      staffPhone: cleanPhone || "012 345 678",
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(session);
    return { success: true, session };
  }

  return {
    success: false,
    error: `ព័ត៌មានមិនត្រឹមត្រូវឡើយ! សូមពិនិត្យ Email, លេខទូរស័ព្ទ, ឬ PIN ឡើងវិញ (PIN: 6666, 1234 ឬ 9999)។`,
  };
}

// ==========================================
// Attendance Storage
// ==========================================

export function loadAttendanceRecords(): AttendanceRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAttendanceRecord(record: AttendanceRecord): AttendanceRecord[] {
  if (typeof window === "undefined") return [record];
  try {
    const current = loadAttendanceRecords();
    const updated = [record, ...current].slice(0, 500);

    // Optimize localStorage quota by keeping photoBase64 only for the latest 5 records
    const storageOptimized = updated.map((r, index) => {
      if (index >= 5 && r.photoBase64) {
        const { photoBase64: _, ...rest } = r;
        return rest as AttendanceRecord;
      }
      return r;
    });

    try {
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(storageOptimized));
    } catch (quotaErr) {
      console.warn("Storage quota exceeded, stripping all photos to preserve records", quotaErr);
      // Strip all photos and retry to ensure records are NEVER lost
      const noPhotos = storageOptimized.map(({ photoBase64: _, ...rest }) => rest as AttendanceRecord);
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(noPhotos));
    }

    return updated;
  } catch (err) {
    console.error("Failed to save attendance record", err);
    return [record];
  }
}

export function clearAttendanceRecords(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY_ATTENDANCE);
}

// ==========================================
// Settings Storage
// ==========================================

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      geminiApiKey: parsed.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey,
      telegramBotToken: parsed.telegramBotToken || DEFAULT_SETTINGS.telegramBotToken,
      telegramChatId: parsed.telegramChatId || DEFAULT_SETTINGS.telegramChatId,
      telegramAccountingChatId: parsed.telegramAccountingChatId || DEFAULT_SETTINGS.telegramAccountingChatId,
      gpsSimMode: parsed.gpsSimMode || DEFAULT_SETTINGS.gpsSimMode,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings", err);
  }
}

// ==========================================
// Leave Requests Storage
// ==========================================

export function loadLeaveRequests(): LeaveRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEAVES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLeaveRequest(request: LeaveRequest): LeaveRequest[] {
  if (typeof window === "undefined") return [request];
  try {
    const current = loadLeaveRequests();
    const updated = [request, ...current];
    try {
      localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn("Storage quota exceeded saving leave, optimizing older entries", quotaErr);
      const optimized = updated.map((l, index) => {
        if (index >= 5 && l.signatureDataUrl) {
          const { signatureDataUrl: _, ...rest } = l;
          return rest as LeaveRequest;
        }
        return l;
      });
      localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(optimized));
    }

    // Automatically update staff's used quota if AL was used
    if (request.useAL) {
      deductStaffLeaveQuota(request.staffId, request.totalDays);
    }

    return updated;
  } catch (err) {
    console.error("Failed to save leave request", err);
    return [request];
  }
}

export function updateLeaveRequestStatus(requestId: string, status: LeaveStatus): LeaveRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const current = loadLeaveRequests();
    const target = current.find((r) => r.id === requestId);

    if (target && target.useAL) {
      // If transitioning to REJECTED from non-rejected, refund quota
      if (status === "REJECTED" && target.status !== "REJECTED") {
        refundStaffLeaveQuota(target.staffId, target.totalDays);
      }
      // If transitioning back to APPROVED/PENDING from REJECTED, re-deduct quota
      else if (status !== "REJECTED" && target.status === "REJECTED") {
        deductStaffLeaveQuota(target.staffId, target.totalDays);
      }
    }

    const updated = current.map((r) => (r.id === requestId ? { ...r, status } : r));
    localStorage.setItem(STORAGE_KEY_LEAVES, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Failed to update leave request status", err);
    return [];
  }
}

export function deductStaffLeaveQuota(staffId: string, days: number): void {
  if (typeof window === "undefined") return;
  try {
    const currentStaff = loadStaffList();
    const updated = currentStaff.map((s) => {
      if (s.id === staffId) {
        const used = parseFloat(((s.leaveUsed || 0) + days).toFixed(2));
        return { ...s, leaveUsed: used };
      }
      return s;
    });
    saveStaffList(updated);
  } catch (err) {
    console.error("Failed to update staff leave quota", err);
  }
}

export function refundStaffLeaveQuota(staffId: string, days: number): void {
  if (typeof window === "undefined") return;
  try {
    const currentStaff = loadStaffList();
    const updated = currentStaff.map((s) => {
      if (s.id === staffId) {
        const used = Math.max(0, parseFloat(((s.leaveUsed || 0) - days).toFixed(2)));
        return { ...s, leaveUsed: used };
      }
      return s;
    });
    saveStaffList(updated);
  } catch (err) {
    console.error("Failed to refund staff leave quota", err);
  }
}

// ==========================================
// Branch Locations Storage & Configuration
// ==========================================
const STORAGE_KEY_BRANCHES = "v2_attendance_branches_v2";

export function loadBranchLocations(): Record<BranchId, Branch> {
  if (typeof window === "undefined") return V2_BRANCHES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BRANCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BRANCHES, JSON.stringify(V2_BRANCHES));
      return V2_BRANCHES;
    }
    const parsed = JSON.parse(raw);
    const merged: Record<BranchId, Branch> = { ...V2_BRANCHES };
    for (const key of Object.keys(V2_BRANCHES) as BranchId[]) {
      if (parsed[key]) {
        merged[key] = {
          ...V2_BRANCHES[key],
          ...parsed[key],
          addressEnglish: parsed[key].addressEnglish !== undefined ? parsed[key].addressEnglish : V2_BRANCHES[key].addressEnglish,
          contactNumber: parsed[key].contactNumber !== undefined ? parsed[key].contactNumber : V2_BRANCHES[key].contactNumber,
          telegram: parsed[key].telegram !== undefined ? parsed[key].telegram : V2_BRANCHES[key].telegram,
          facebookPage: parsed[key].facebookPage !== undefined ? parsed[key].facebookPage : V2_BRANCHES[key].facebookPage,
        };
      }
    }
    return merged;
  } catch {
    return V2_BRANCHES;
  }
}

export function saveBranchLocations(branches: Record<BranchId, Branch>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_BRANCHES, JSON.stringify(branches));
  } catch (err) {
    console.error("Failed to save branch locations", err);
  }
}

export function updateStaffRole(staffId: string, newRole: string): Staff[] {
  const current = loadStaffList();
  const updated = current.map((s) => (s.id === staffId ? { ...s, role: newRole.trim() } : s));
  saveStaffList(updated);
  return updated;
}
