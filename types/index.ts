// ==========================================
// V2 Education - Types & Interfaces
// ==========================================

export type BranchId = 'BKK' | 'OLP' | 'TTP' | 'TK' | 'STM' | 'BS' | 'SS' | 'CA' | 'PSL' | 'SR';

export interface Branch {
  id: BranchId;
  nameKhmer: string;
  nameEnglish: string;
  addressKhmer: string;
  addressEnglish?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  color: string;
  contactNumber?: string;
  facebookPage?: string;
  telegram?: string;
}

export type StaffCategory = 'TEACHER' | 'STAFF';

// ឋានានុក្រមបុគ្គលិក: ថ្នាក់ដឹកនាំ (គ្រប់គ្រងដោយ CFO) ឬ បុគ្គលិកគ្រប់ផ្នែក (គ្រប់គ្រងដោយប្រធានគណនេយ្យ)
export type StaffTier = 'LEADERSHIP' | 'OPERATIONS';

// កាលវិភាគវេនម៉ោងធ្វើការ (Shift Time Slot)
export interface ShiftTimeSlot {
  checkIn: string;   // Format "HH:mm" e.g. "07:30"
  checkOut: string;  // Format "HH:mm" e.g. "11:30"
}

// កាលវិភាគប្រចាំថ្ងៃ (អាចមាន ២ វេនក្នុងមួយថ្ងៃ)
export interface DayShiftSchedule {
  enabled: boolean;          // បើកធ្វើការនៅថ្ងៃនេះ
  hasTwoShifts: boolean;     // មាន ២ វេន (2 shifts) ក្នុងមួយថ្ងៃ
  shift1: ShiftTimeSlot;     // វេនទី ១ (ព្រឹក)
  shift2: ShiftTimeSlot & { enabled?: boolean }; // វេនទី ២ (រសៀល/យប់)
}

// កាលវិភាគម៉ោងធ្វើការបែងចែក ចន្ទ-សុក្រ, សៅរ៍, អាទិត្យ
export interface StaffSchedule {
  monFri: DayShiftSchedule;  // ចន្ទ - សុក្រ (Monday - Friday)
  sat: DayShiftSchedule;     // សៅរ៍ (Saturday)
  sun: DayShiftSchedule;     // អាទិត្យ (Sunday)
}

// វេលាធ្វើការ: ២ម៉ោង, ៤ម៉ោង, ៦ម៉ោង, ៨ម៉ោង, ១២កន្លះម៉ោងក្នុងមួយថ្ងៃ
export type ShiftDurationHours = 2 | 4 | 6 | 8 | 12.5;

export type UserRole = "ADMIN" | "STAFF";

export interface AuthSession {
  role: UserRole;
  staffId?: string; // Set when role === "STAFF"
  staffName?: string;
  staffRole?: string;
  staffBranchId?: BranchId;
  staffCode?: string;
  staffEmail?: string;
  staffPhone?: string;
  loggedInAt: string;
}

export interface Staff {
  id: string;
  code?: string;                   // លេខកូដសម្គាល់បុគ្គលិក e.g. "V2-BKK01"
  passcode?: string;               // លេខកូដ PIN សម្ងាត់ e.g. "1234"
  name: string;
  role: string;
  branchId: BranchId;
  category?: StaffCategory;        // 👨‍🏫 គ្រូបង្រៀន ឬ 🏢 បុគ្គលិកទូទៅ
  tier?: StaffTier;                // 👑 ថ្នាក់ដឹកនាំ (គ្រប់គ្រងដោយ CFO) ឬ 👥 បុគ្គលិកគ្រប់ផ្នែក (គ្រប់គ្រងដោយប្រធានគណនេយ្យ)
  supervisor?: string;             // អ្នកគ្រប់គ្រងផ្ទាល់: "CFO" ឬ "ប្រធានគណនេយ្យ"
  dateOfBirth?: string;            // ថ្ងៃខែឆ្នាំកំណើត (DOB) e.g. "1994-08-15"
  startDate?: string;              // ថ្ងៃចូលបម្រើការងារ e.g. "2022-01-10"
  seniority?: string;              // អតីតភាពការងារ e.g. "2 ឆ្នាំ 6 ខែ"
  schedule?: StaffSchedule;        // កាលវិភាគម៉ោងធ្វើការ (ចន្ទ-សុក្រ, សៅរ៍, អាទិត្យ ដោយមាន ២ វេន/ថ្ងៃ)
  subject?: string;                // សម្រាប់គ្រូបង្រៀន (គណិត, រូប, គីមី, ជីវៈ, etc.)
  department?: string;             // សម្រាប់បុគ្គលិក (រដ្ឋបាល, គណនេយ្យ, IT, etc.)
  baseSalary?: number;             // ប្រាក់ខែគោល (USD $)
  leaveQuota?: number;             // កូតាច្បាប់ប្រចាំឆ្នាំ (ចំនួន AI ច្បាប់ ឧ. 18 ថ្ងៃ)
  leaveUsed?: number;              // ចំនួនថ្ងៃច្បាប់បានប្រើរួច
  shiftHours?: ShiftDurationHours; // 2 | 4 | 6 | 8 | 12.5 ម៉ោងក្នុងមួយថ្ងៃ
  checkInTime: string;             // Format "HH:mm" e.g. "07:30"
  checkOutTime: string;            // Format "HH:mm" e.g. "17:00"
  avatarUrl?: string;
  phone?: string;
  email?: string;
  isAdmin?: boolean;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  timestamp: string;               // ISO String
  formattedTime: string;           // "HH:mm:ss"
  formattedDate: string;           // "DD/MM/YYYY"
  staffId: string;
  staffName: string;
  staffRole: string;
  branchId: BranchId;
  branchName: string;
  category: StaffCategory;
  subjectOrDept: string;
  baseSalary: number;
  shiftHours: ShiftDurationHours;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  substituteStaff?: string;
  leaveQuotaTotal: number;
  leaveQuotaUsed: number;
  leaveQuotaRemaining: number;
  isQuotaExceeded: boolean;
  useAL: boolean;                  // true = ប្រើប្រាស់ AL (កាត់កូតាច្បាប់), false = អត់ប្រើ AL (Unpaid/ពិសេស)
  gender?: string;                 // "ប្រុស" ឬ "ស្រី" (ពីទម្រង់ពាក្យសុំច្បាប់ផ្លូវការ)
  resumeDate?: string;             // ថ្ងៃត្រឡប់មកបង្រៀន/ធ្វើការវិញ
  classGroupName?: string;         // ឈ្មោះក្រុម/ថ្នាក់បង្រៀនទី ១
  classShiftTime?: string;         // ម៉ោងចូល-ម៉ោងចេញ នៃថ្នាក់ទី ១
  classGroupName2?: string;        // ឈ្មោះក្រុម/ថ្នាក់បង្រៀនទី ២
  classShiftTime2?: string;        // ម៉ោងចូល-ម៉ោងចេញ នៃថ្នាក់ទី ២
  durationUnit?: 'DAYS' | 'HOURS'; // គិតជាថ្ងៃ ឬ គិតជាម៉ោង
  leaveHours?: number;             // ចំនួនម៉ោងសុំច្បាប់ (ឧ. ២ ម៉ោង, ៤ ម៉ោង)
  fromTime?: string;               // ចាប់ពីម៉ោង (ឧ. "08:00")
  toTime?: string;                 // ដល់ម៉ោង (ឧ. "10:00")
  applicantSignature?: string;     // ឈ្មោះហត្ថលេខាសាមីខ្លួន
  signatureDataUrl?: string;       // រូបភាពគំនូសហត្ថលេខា (Digital Drawn Signature PNG Data URL)
  signatureDate?: string;          // កាលបរិច្ឆេទចុះហត្ថលេខា
  status: LeaveStatus;
  accountantChatId?: string;
  telegramSent: boolean;
}

export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';

export type PunctualityStatus = 
  | 'EARLY'        // 🟢 មកលឿន / មកមុន
  | 'ON_TIME'      // 🔵 មកទាន់ម៉ោង
  | 'LATE'         // 🔴 មកយឺត
  | 'EARLY_LEAVE'  // 🟠 ចេញមុន
  | 'ON_TIME_LEAVE'; // 🔵 ចេញធម្មតា

export interface PunctualityResult {
  status: PunctualityStatus;
  labelKhmer: string;
  diffMinutes: number;
  badgeClass: string;
  detailKhmer: string;
  shiftName?: string;
  dayName?: string;
}

export interface GeofenceResult {
  isWithinGeofence: boolean;
  distanceMeters: number;
  branchRadiusMeters: number;
  statusLabelKhmer: string; // '✅ ក្នុងបរិវេណ' or '⚠️ ក្រៅបរិវេណ'
  googleMapsUrl: string;
}

export interface AIValidationResult {
  isValid: boolean;
  isRealPerson: boolean;
  summaryKhmer: string;
  confidence?: number;
}

export interface AttendanceRecord {
  id: string;
  timestamp: string; // ISO String
  formattedTime: string; // "HH:mm:ss"
  formattedDate: string; // "DD/MM/YYYY"
  type: AttendanceType;
  staffId: string;
  staffName: string;
  staffRole: string;
  branchId: BranchId;
  branchName: string;
  userCoords: {
    latitude: number;
    longitude: number;
  };
  geofence: GeofenceResult;
  punctuality: PunctualityResult;
  aiVerification: AIValidationResult;
  photoBase64?: string;
  telegramNotified: boolean;
  telegramMessageId?: number;
}
