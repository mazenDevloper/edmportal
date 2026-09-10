
export const CAT_CONFIG = {
  building: { labelAr: "بناء (هندسية)", labelEn: "Building (Eng)", color: "bg-blue-50 text-blue-700 border-blue-200" },
  health: { labelAr: "صحية (مختبرات)", labelEn: "Health (Labs)", color: "bg-green-50 text-green-700 border-green-200" },
  invest: { labelAr: "استثمارية (عقود)", labelEn: "Investment", color: "bg-purple-50 text-purple-700 border-purple-200" },
  tech: { labelAr: "فنية (حفر)", labelEn: "Technical", color: "bg-orange-50 text-orange-700 border-orange-200" },
  elec: { labelAr: "إلكتروني", labelEn: "Electronic", color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  absher: { labelAr: "أبشر", labelEn: "Absher", color: "bg-[#800000] text-white border-[#800000]" },
  new: { labelAr: "جديد", labelEn: "New", color: "bg-teal-500 text-white border-teal-600" },
  off: { labelAr: "حضوري", labelEn: "In-Person", color: "bg-slate-100 text-slate-700 border-slate-200" },
  admin: { labelAr: "إدارية", labelEn: "Admin", color: "bg-slate-50 text-slate-600 border-slate-200" }
};

export type CategoryId = keyof typeof CAT_CONFIG;
