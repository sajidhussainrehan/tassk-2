import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import RamadanQuiz from "./RamadanQuiz";
import QuduratStudent from "./QuduratStudent";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function StudentProfilePublic() {
  const { studentId: paramId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/students/${paramId}`);
      setStudent(res.data);
    } catch (err) {
      console.error("Error fetching student:", err);
    } finally {
      setLoading(false);
    }
  }, [paramId]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#006d44] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-red-500">
        ❌ Student not found
      </div>
    );
  }

  const services = [
    { name: "مقاطع الفيديو", icon: "📹", color: "bg-blue-100 text-blue-600", link: "/" },
    { name: "الاستثمارات", icon: "📈", color: "bg-emerald-100 text-emerald-600", link: "/" },
    { name: "المبادرات", icon: "🚩", color: "bg-orange-100 text-orange-600", link: "/" },
    { name: "الحلقة", icon: "✅", color: "bg-purple-100 text-purple-600", link: "/" },
    { name: "المسابقات", icon: "🏆", color: "bg-yellow-100 text-yellow-600", link: "/" },
    { name: "الحضور", icon: "📅", color: "bg-cyan-100 text-cyan-600", link: "/" },
    { name: "كشف الحساب", icon: "📄", color: "bg-rose-100 text-rose-600", link: "/" },
    { name: "الترتيب", icon: "📊", color: "bg-indigo-100 text-indigo-600", link: "/league" },
    { name: "الكتب", icon: "📚", color: "bg-amber-100 text-amber-600", link: "/" }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 pb-32 overflow-x-hidden" dir="rtl">
      {/* Top Banner & Profile (Image 4 Header Style) */}
      <div className="relative h-64 bg-gradient-to-br from-[#006d44] to-[#014029] overflow-hidden rounded-b-[3rem] shadow-xl">
        <div className="absolute top-0 right-0 p-8 flex items-center gap-4 z-20">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
            <p className="text-[10px] font-black text-white/70 uppercase">Total Points</p>
            <p className="text-2xl font-black text-white italic leading-none">{student.points || 0}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-xl shadow-lg border-2 border-white animate-bounce-slow">🏅</div>
        </div>

        <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white">
              <img 
                src={student.image_url ? `${API_BASE}${student.image_url}` : "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"} 
                className="w-full h-full object-cover" 
                alt={student.name} 
              />
            </div>
          </div>
          <h2 className="mt-4 text-xl font-black uppercase tracking-wider text-gray-800 bg-white/50 backdrop-blur-sm px-6 py-1 rounded-full">{student.name}</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[.2em] mt-1">{student.group || "Ghiras Club Member"}</p>
        </div>
      </div>

      <div className="mt-20 px-6 space-y-10 animate-fadeIn">
        {/* Status Card (Image 4 center card) */}
        <div className="bg-emerald-50 rounded-[2.5rem] p-8 text-center border-t-8 border-[#006d44] shadow-lg shadow-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-full -mr-12 -mt-12 opacity-50"></div>
          <p className="text-[11px] font-black text-emerald-800/60 tracking-widest uppercase mb-4">Ramadan Status</p>
          <p className="text-2xl font-black text-[#006d44] leading-tight mb-2 italic">رمضان مبارك! تقبل الله طاعتكم</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`w-3 h-3 rounded-full ${i === 1 ? 'bg-[#006d44]' : 'bg-emerald-200'}`}></span>
            ))}
          </div>
        </div>

        {/* Services Grid (Image 3 Buttons) */}
        <div>
          <h3 className="text-sm font-black text-gray-400 mb-6 uppercase tracking-[0.3em] mr-2">الخدمات الأساسية</h3>
          <div className="grid grid-cols-3 gap-6">
            {services.map((s, idx) => (
              <Link to={s.link} key={idx} className="flex flex-col items-center gap-3 group">
                <div className={`w-20 h-20 ${s.color} rounded-3xl flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all border border-white`}>
                  {s.icon}
                </div>
                <span className="text-[10px] font-black text-gray-600 text-center uppercase leading-tight">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Level Card (Image 1 Style) */}
        <div className="bg-[#1a1f2e] text-white rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#006d44]/10 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 italic">Ghiras Rank</p>
              <h4 className="text-4xl font-black uppercase italic leading-none mb-1">Elite Master</h4>
              <p className="text-gray-500 text-[10px] font-bold tracking-widest">RANK 12 ON GLOBAL LEADERBOARD</p>
            </div>
            <div className="w-24 h-24 rounded-full bg-[#006d44] flex flex-col items-center justify-center border-8 border-[#252a3a] shadow-xl">
              <span className="text-2xl font-black leading-none">80</span>
              <span className="text-[8px] font-black uppercase">Level</span>
            </div>
          </div>

          <div className="mt-10 space-y-6">
              {[
                  { label: "المعرفة", val: 85, color: "bg-purple-500" },
                  { label: "المستثمر", val: 92, color: "bg-emerald-500" },
                  { label: "التعاون", val: 78, color: "bg-orange-500" },
                  { label: "الانضباط", val: 95, color: "bg-cyan-500" },
                  { label: "ضبط النفس", val: 88, color: "bg-red-500" }
              ].map(skill => (
                <div key={skill.label} className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter">
                        <span className="text-gray-400">{skill.label}</span>
                        <span className="text-white">{skill.val}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${skill.color} rounded-full flex items-center justify-end px-1`} style={{ width: `${skill.val}%` }}>
                            <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                        </div>
                    </div>
                </div>
              ))}
          </div>
        </div>

        {/* Quizzes & Summaries */}
        <div className="space-y-12">
            <RamadanQuiz studentId={student.id} studentName={student.name} />
            <QuduratStudent studentId={student.id} studentName={student.name} />
        </div>
      </div>

      {/* Fixed Bottom Bar (Image 3/4 nav) */}
      <div className="fixed bottom-6 left-6 right-6 z-[100]">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border-2 border-emerald-50 p-2 shadow-2xl flex items-center justify-between overflow-hidden">
          <Link to="/" className="flex-1 flex flex-col items-center gap-1 py-2 text-[#006d44]">
            <span className="text-lg">🏠</span>
            <span className="text-[8px] font-black uppercase tracking-tighter underline underline-offset-4">Home</span>
          </Link>
          <div className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400">
            <span className="text-lg">🔔</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Alerts</span>
          </div>
          <div className="w-16 h-16 -mt-10 bg-[#006d44] rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-200 border-4 border-white ring-4 ring-emerald-50 transition-all active:scale-90 cursor-pointer">
            <span className="text-2xl">⚡</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400">
            <span className="text-lg">📋</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Tasks</span>
          </div>
          <Link to="/league" className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-[#006d44] transition-colors">
            <span className="text-lg">🏆</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">League</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StudentProfilePublic;
