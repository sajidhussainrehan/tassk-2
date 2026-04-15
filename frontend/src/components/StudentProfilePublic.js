import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import QuduratStudent from "./QuduratStudent";
import ChallengesStudent from "./ChallengesStudent";
import TasksStudent from "./TasksStudent";
import PointsHistoryStudent from "./PointsHistoryStudent";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function StudentProfilePublic() {
  const { studentId: paramId } = useParams();
  const [student, setStudent] = useState(null);
  const [rankInfo, setRankInfo] = useState({ rank: 0, total: 0 });
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, matchesRes, leaderboardRes] = await Promise.all([
        axios.get(`${API}/students/${paramId}/profile`).catch(err => {
          console.error("Profile error:", err);
          return { data: { student: null, rank: 0, total_students: 0 } };
        }),
        axios.get(`${API}/matches/upcoming`).catch(err => {
          console.error("Matches error:", err);
          return { data: [] };
        }),
        axios.get(`${API}/students`).catch(err => {
          console.error("Leaderboard error:", err);
          return { data: [] };
        })
      ]);

      if (profileRes.data && profileRes.data.student) {
        setStudent(profileRes.data.student);
        setRankInfo({ rank: profileRes.data.rank, total: profileRes.data.total_students });
      } else {
        setStudent(null);
      }
      
      setUpcomingMatches(matchesRes.data || []);
      setLeaderboard(leaderboardRes.data || []);
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
    { name: "مقاطع الفيديو", icon: "📹", color: "bg-blue-100 text-blue-600", link: "#qudurat" },
    { name: "المبادرات", icon: "🚩", color: "bg-rose-100 text-rose-600", link: "#initiatives" },
    { name: "الحلقة", icon: "✅", color: "bg-purple-100 text-purple-600", link: "#halaqa" },
    { name: "المسابقات", icon: "🏆", color: "bg-yellow-100 text-yellow-600", link: "#challenges" },
    { name: "الحضور", icon: "📅", color: "bg-cyan-100 text-cyan-600", link: "#attendance" },
    { name: "كشف الحساب", icon: "📄", color: "bg-emerald-100 text-emerald-600", link: "#history" },
    { name: "الترتيب", icon: "📊", color: "bg-indigo-100 text-indigo-600", link: "/league" },
    { name: "الكتب", icon: "📚", color: "bg-amber-100 text-amber-600", link: "#books" }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 pb-32 overflow-x-hidden" dir="rtl">
      {/* Top Banner & Profile (Enhanced Style) */}
      <div className="relative h-96 bg-gradient-to-br from-[#006d44] to-[#014029] overflow-hidden rounded-b-[4rem] shadow-2xl">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
          <div className="relative group">
            <div className="w-40 h-40 rounded-full border-8 border-white/20 shadow-2xl overflow-hidden bg-white ring-8 ring-[#006d44]/50 group-hover:scale-105 transition-all duration-500">
              <img 
                src={student.image_url ? (student.image_url.startsWith('data:') ? student.image_url : `${API_BASE}${student.image_url}`) : "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"} 
                className="w-full h-full object-cover" 
                alt={student.name} 
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white animate-bounce-slow">🏅</div>
          </div>
          
          <div className="text-center mt-6 space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-lg">{student.name}</h2>
            <div className="bg-white/10 backdrop-blur-xl px-10 py-3 rounded-full border border-white/20 inline-flex items-center gap-3 shadow-2xl">
              <span className="text-4xl font-black text-yellow-300 italic drop-shadow-sm">{student.points || 0}</span>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">إجمالي النقاط</span>
                <span className="text-lg">⭐</span>
              </div>
            </div>
            <p className="text-xs font-black text-white/50 uppercase tracking-[.4em]">{student.group || "Ghiras Club Member"}</p>
          </div>
        </div>
      </div>

      <div className="mt-16 px-6 space-y-16 animate-fadeIn">
        {/* Services Grid (Enlarged Icons) */}
        <div>
          <h3 className="text-xs font-black text-gray-400 mb-8 uppercase tracking-[0.4em] mr-2 flex items-center gap-2">
            <span className="w-8 h-[2px] bg-gray-200"></span>
            الخدمات الأساسية
          </h3>
          <div className="grid grid-cols-3 gap-8">
            {services.map((s, idx) => (
              <a href={s.link} key={idx} className="flex flex-col items-center gap-4 group">
                <div className={`w-28 h-28 ${s.color} rounded-[2.5rem] flex items-center justify-center text-4xl shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 border-2 border-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12"></div>
                  <span className="relative z-10">{s.icon}</span>
                </div>
                <span className="text-[12px] font-black text-gray-700 text-center uppercase leading-tight tracking-wider">{s.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Level Card (Enlarged Style) */}
        <div className="bg-[#1a1f2e] text-white rounded-[4rem] p-12 relative overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#006d44]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-gray-500 text-[11px] font-black tracking-widest uppercase mb-1">Leaderboard Status</p>
              <p className="text-xl font-black italic text-[#006d44]">Rank #{rankInfo.rank} <span className="text-gray-400 font-bold not-italic text-sm">/ {rankInfo.total}</span></p>
            </div>
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#006d44] to-emerald-600 flex flex-col items-center justify-center border-[10px] border-[#252a3a] shadow-2xl scale-110">
              <span className="text-4xl font-black leading-none italic">80</span>
              <span className="text-[10px] font-black uppercase tracking-tighter">Level</span>
            </div>
          </div>

          <div className="mt-12 space-y-8">
              {[
                  { label: "المعرفة", val: 85, color: "bg-purple-500" },
                  { label: "المستثمر", val: 92, color: "bg-emerald-500" },
                  { label: "التعاون", val: 78, color: "bg-orange-500" },
                  { label: "الانضباط", val: 95, color: "bg-cyan-500" },
                  { label: "ضبط النفس", val: 88, color: "bg-red-500" }
              ].map(skill => (
                <div key={skill.label} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-gray-400">{skill.label}</span>
                        <span className="text-white">{skill.val}%</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                        <div className={`h-full ${skill.color} rounded-full flex items-center justify-end px-1 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-1000`} style={{ width: `${skill.val}%` }}>
                            <div className="w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                        </div>
                    </div>
                </div>
              ))}
          </div>
        </div>

        {/* Upcoming League Matches */}
        {upcomingMatches.length > 0 && (
          <div>
            <h3 className="text-xs font-black text-gray-400 mb-8 uppercase tracking-[0.4em] mr-2 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-gray-200"></span>
              المباريات القادمة
            </h3>
            <div className="space-y-4">
              {upcomingMatches.map((match, idx) => (
                <div key={match.id || idx} className="bg-[#1a1f2e] text-white rounded-[2.5rem] p-8 border border-white/5 shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#006d44] to-emerald-400"></div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">⚽ مباراة قادمة</span>
                    {match.match_date && (
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full">
                        📅 {match.match_date}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-center">
                    <div className="flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl shadow-inner border border-emerald-500/20">🛡️</div>
                      <p className="text-[12px] font-black uppercase text-gray-200">{match.team1}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 px-6">
                      <span className="text-4xl font-black text-gray-500/30 italic">VS</span>
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                        {match.status === "scheduled" ? "Scheduled" : "Soon"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-700/10 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl shadow-inner border border-blue-500/20">🛡️</div>
                      <p className="text-[12px] font-black uppercase text-gray-200">{match.team2}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Initiatives & Challenges */}
        <div className="space-y-16">
            <div id="initiatives"><TasksStudent studentId={student.id} studentName={student.name} studentGroup={student.group} /></div>
            <div id="challenges"><ChallengesStudent studentId={student.id} studentName={student.name} /></div>
            <div id="history"><PointsHistoryStudent studentId={student.id} /></div>
            <div id="qudurat"><QuduratStudent studentId={student.id} studentName={student.name} /></div>
        </div>

        {/* Global Leaderboard (Enlarged) */}
        {leaderboard.length > 0 && (
          <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-gray-200 border border-gray-100">
            <div className="text-center mb-10">
                <h3 className="text-xs font-black text-gray-400 mb-2 uppercase tracking-[0.4em]">Global Ranking</h3>
                <p className="text-2xl font-black text-gray-800">ترتيب نجوم النادي 📊</p>
            </div>
            <div className="space-y-4">
              {leaderboard.slice(0, 10).map((s, idx) => (
                <div 
                  key={s.id} 
                  className={`flex items-center gap-6 p-6 rounded-[2rem] border transition-all duration-300 ${
                    s.id === student.id 
                      ? "bg-[#006d44] text-white border-transparent scale-105 shadow-2xl z-10" 
                      : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                    idx === 0 ? "bg-yellow-400 text-white shadow-yellow-200" : 
                    idx === 1 ? "bg-gray-300 text-white shadow-gray-200" : 
                    idx === 2 ? "bg-orange-400 text-white shadow-orange-200" : 
                    s.id === student.id ? "bg-white/20 text-white" : "bg-white text-gray-400 border border-gray-100"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`font-black text-lg ${s.id === student.id ? "text-white" : "text-gray-800"}`}>
                      {s.name}
                      {s.id === student.id && <span className="mr-3 text-[10px] bg-white text-[#006d44] px-3 py-1 rounded-full font-black uppercase">أنت</span>}
                    </p>
                    <p className={`text-[11px] font-bold tracking-widest uppercase ${s.id === student.id ? "text-white/60" : "text-gray-400"}`}>{s.group}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`text-3xl font-black italic leading-none ${s.id === student.id ? "text-white" : "text-[#006d44]"}`}>{s.points}</p>
                    <p className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${s.id === student.id ? "text-white/40" : "text-gray-300"}`}>Overall Points</p>
                  </div>
                </div>
              ))}
              {leaderboard.length > 10 && !leaderboard.slice(0, 10).some(s => s.id === student.id) && (
                <>
                  <div className="text-center text-gray-200 text-3xl py-4">•••</div>
                  <div className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-[#006d44] text-white border-transparent scale-105 shadow-2xl">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl bg-white/20">
                      {rankInfo.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-lg text-white">
                        {student.name}
                        <span className="mr-3 text-[10px] bg-white text-[#006d44] px-3 py-1 rounded-full font-black uppercase">أنت</span>
                      </p>
                      <p className="text-[11px] font-bold tracking-widest uppercase text-white/60">{student.group}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-3xl font-black italic leading-none text-white">{student.points}</p>
                      <p className="text-[9px] font-black uppercase tracking-tighter mt-1 text-white/40">Overall Points</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar (Image 3/4 nav) */}
      <div className="fixed bottom-6 left-6 right-6 z-[100]">
        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] border-2 border-emerald-50 p-2 shadow-2xl flex items-center justify-between overflow-hidden">
          <Link to={`/public/${student.id}`} className="flex-1 flex flex-col items-center gap-1 py-2 text-[#006d44]">
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
          <a href="#initiatives" className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-[#006d44] transition-colors">
            <span className="text-lg">📋</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Initiatives</span>
          </a>
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
