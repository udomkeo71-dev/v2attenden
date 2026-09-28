"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SalaryManagement } from "@/components/SalaryManagement";
import { Staff, AuthSession } from "@/types";
import { loadStaffList, loadAuthSession } from "@/lib/storage";
import { Lock, ArrowLeft, ShieldAlert } from "lucide-react";

export default function StandaloneSalaryPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const s = loadAuthSession();
    setSession(s);
    setStaffList(loadStaffList());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-kantumruy">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Strictly restrict to ADMIN role only
  if (!session || session.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-kantumruy text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-battambang text-rose-300">
              ទិន្នន័យសម្ងាត់ផ្ទៃក្នុង (Restricted Access)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              លោកអ្នកមិនមានសិទ្ធិចូលមើលតារាងប្រាក់ខែ និងទិន្នន័យហិរញ្ញវត្ថុរបស់សាលាឡើយ។ មុខងារនេះសម្រាប់តែ Admin ធំប៉ុណ្ណោះ។
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ត្រឡប់ទៅទំព័រដើម</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-kantumruy text-slate-900 dark:text-slate-100 antialiased p-4 max-w-md mx-auto sm:max-w-2xl lg:max-w-5xl">
      <SalaryManagement
        onBack={() => router.push("/")}
        onStaffUpdated={(newList) => setStaffList(newList)}
        onOpenAddStaff={() => router.push("/")}
      />
    </div>
  );
}
