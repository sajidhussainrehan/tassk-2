import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import RamadanQuiz from "./RamadanQuiz";
import QuduratStudent from "./QuduratStudent";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StudentProfilePublic() {
  const [renderError, setRenderError] = useState(null);
  
  if (renderError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50" dir="rtl">
        <div className="text-center p-6">
          <p className="text-xl text-red-600 mb-4">❌ حدث خطأ في عرض الصفحة</p>
          <p className="text-sm text-gray-600">{renderError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-[#006d44] text-white px-4 py-2 rounded-lg"
          >
            إعادة تحميل
          </button>
        </div>
      </div>
    );
  }

  return <StudentProfileContent setRenderError={setRenderError} />;
}

function StudentProfileContent({ setRenderError }) {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [rank, setRank] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("home");

  const fetchData = useCallback(async () => {
    try {
      const [profileRes] = await Promise.all([
        axios.get(`${API}/students/${studentId}/profile`),
      ]);
      setStudent(profileRes.data.student);
      setRank(profileRes.data.rank);
      setTotalStudents(profileRes.data.total_students);
    } catch (err) {
      console.error("StudentProfilePublic fetch error:", err);
      setError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-[#006d44] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#006d44] font-bold">جاري التحميل...</p>
      </div>
    </div>
  );

  if (error || !student) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-red-600 font-bold">{error || "الطالب غير موجود"}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fbfa] pb-24" dir="rtl">
      {/* Header matching Image 4 */}
      <div className="relative bg-[#f8fbfa] pt-6 px-6 overflow-hidden">
        {/* Decorative background elements (Ramadan/Islamic theme from image) */}
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="180" cy="20" r="100" fill="#006d44" />
            </svg>
        </div>

        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-white">
                    {student.image_url ? (
                        <img src={student.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xl font-bold">
                            {(student.name || '?').charAt(0)}
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-sm font-bold text-gray-500">رمضان مبارك</h2>
                    <h1 className="text-lg font-black text-[#006d44]">{student.name}</h1>
                    <p className="text-[10px] text-gray-400 font-bold">انطلق اليوم لإنجاز جديد</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button className="bg-[#006d44] text-white p-2 rounded-full shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                </button>
                <button className="bg-[#006d44] text-white p-2 rounded-full shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Main Points Card (Image 4) */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center relative mb-8 border border-gray-100">
            <div className="absolute top-8 right-8">
                <div className="bg-[#f8fbfa] border-2 border-yellow-400 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="text-yellow-500 text-sm font-black">#{rank || '-'}</span>
                    <span className="bg-yellow-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]">🏆</span>
                </div>
            </div>
            
            <div className="mb-4">
                <div className="text-7xl font-black text-gray-900 leading-none">{student.points || 0}</div>
                <div className="text-gray-400 font-bold mt-2 tracking-widest text-lg">نقطة</div>
            </div>

            <div className="w-full bg-gray-100 h-2.5 rounded-full mb-3 overflow-hidden">
                <div 
                    className="bg-[#006d44] h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(((student.points || 0) / 10000) * 100, 100)}%` }}
                ></div>
            </div>
            <p className="text-[10px] text-gray-400 font-bold italic">
                {Math.floor(((student.points || 0) / 10000) * 100)}% - باقي {10000 - (student.points || 0)} نقطة للترتيب التالي
            </p>
        </div>

        {/* Ramadan Banner (Image 4 center) */}
        <div className="bg-gradient-to-r from-[#006d44] to-[#014029] rounded-3xl p-6 text-white flex items-center justify-between mb-8 shadow-xl relative overflow-hidden group h-32">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10">
                <h3 className="text-2xl font-black mb-1">شهر رمضان المبارك</h3>
                <p className="text-xs opacity-80">شهر الخير والبركات</p>
            </div>
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
            </div>
        </div>

        {/* Skills Section (Matching Image 1) */}
        <div className="mb-10 animate-fadeIn">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-[#006d44] rounded-full"></div>
                <h2 className="text-xl font-black text-gray-800">المهارات</h2>
            </div>
            
            <div className="bg-[#004e31] rounded-[2.5rem] p-8 text-white text-center mb-6 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="relative z-10">
                    <div className="text-6xl font-black mb-2">80%</div>
                    <div className="text-sm opacity-80 font-bold mb-6 italic uppercase tracking-widest">المستوى العام</div>
                    <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-xs font-bold">بناءً على 6 مهارات</div>
                </div>
            </div>

            <div className="space-y-4">
                {[
                    { label: "المعرفة", value: 75, color: "#7e22ce", icon: "📖" },
                    { label: "المستثمر", value: 100, color: "#059669", icon: "📈" },
                    { label: "التعاون", value: 50, color: "#d97706", icon: "👥" },
                    { label: "الانضباط", value: 91, color: "#0891b2", icon: "📅" },
                    { label: "ضبط النفس", value: 85, color: "#dc2626", icon: "🛡️" },
                ].map((skill, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 flex items-center justify-between group hover:shadow-md transition-all">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="text-gray-400">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-black text-[15px] text-gray-800">{skill.label}</span>
                                    <span className="font-black text-sm" style={{ color: skill.color }}>{skill.value}%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-1000 delay-300" 
                                        style={{ width: `${skill.value}%`, backgroundColor: skill.color }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ml-4 opacity-10`} style={{ backgroundColor: skill.color }}></div>
                        <div className="absolute left-6 text-xl opacity-20 group-hover:opacity-40 transition-opacity">{skill.icon}</div>
                    </div>
                ))}
            </div>

            {/* Hint Box (Image 1 bottom) */}
            <div className="bg-[#f0f9f1] border border-[#006d44]/10 rounded-3xl p-6 mt-6 flex items-start gap-4 shadow-inner">
                <span className="text-2xl">💡</span>
                <div>
                    <h4 className="font-black text-[#006d44] mb-1">نصائح لتحسين مهاراتك</h4>
                    <p className="text-xs text-gray-500 font-bold leading-relaxed">ساعد مجموعتك للفوز في المسابقات ليرتفع مستواك في التعاون والانضباط.</p>
                </div>
            </div>
        </div>

        {/* Services Section (Matching Image 3) */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-[#006d44] rounded-full"></div>
                <h2 className="text-xl font-black text-gray-800">الخدمات</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "مقاطع الفيديو", icon: "📹", color: "bg-purple-100 text-purple-600", active: true },
                    { label: "الاستثمارات", icon: "📈", color: "bg-blue-100 text-blue-600", active: true },
                    { label: "المبادرات", icon: "🚩", color: "bg-emerald-100 text-emerald-600", active: true },
                    { label: "الحلقة", icon: "✅", color: "bg-orange-100 text-orange-600", active: true },
                    { label: "المسابقات", icon: "🏆", color: "bg-red-100 text-red-600", active: true },
                    { label: "الحضور", icon: "📅", color: "bg-sky-100 text-sky-600", active: true },
                    { label: "كشف الحساب", icon: "📄", color: "bg-rose-100 text-rose-600", active: true },
                    { label: "الترتيب", icon: "📊", color: "bg-teal-100 text-teal-600", active: true, link: "/league" },
                    { label: "الكتب", icon: "📚", color: "bg-indigo-100 text-indigo-600", active: true },
                ].map((s, idx) => (
                    s.link ? (
                        <Link to={s.link} key={idx} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition-all active:scale-95 group">
                            <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>{s.icon}</div>
                            <span className="text-[10px] font-black text-gray-600">{s.label}</span>
                        </Link>
                    ) : (
                        <button key={idx} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition-all active:scale-95 group">
                            <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>{s.icon}</div>
                            <span className="text-[10px] font-black text-gray-600">{s.label}</span>
                        </button>
                    )
                ))}
            </div>
        </div>

        {/* Qudurat & Quiz as sub-sections if needed */}
        <div className="space-y-6">
            <RamadanQuiz studentId={studentId} onPointsUpdate={fetchData} />
            <QuduratStudent studentId={studentId} />
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-8 py-3 flex justify-between items-center z-50">
        <button className="flex flex-col items-center gap-1 text-[#006d44]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="text-[10px] font-bold">الرئيسية</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-bold">التنبيهات</span>
        </button>
        <div className="bg-[#006d44] w-12 h-12 rounded-2xl flex items-center justify-center -mt-10 shadow-lg shadow-emerald-200 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        </div>
        <button className="flex flex-col items-center gap-1 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[10px] font-bold">المهام</span>
        </button>
        <Link to="/league" className="flex flex-col items-center gap-1 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-[10px] font-bold">الترتيب</span>
        </Link>
      </div>
    </div>
  );
}

export default StudentProfilePublic;
