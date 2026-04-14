import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function SportsLeaguePage() {
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [activeTab, setActiveTab] = useState("ranking");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, sRes] = await Promise.all([
        axios.get(`${API}/matches`),
        axios.get(`${API}/league-standings`)
      ]);
      setMatches(mRes.data || []);
      setStandings(sRes.data || []);
    } catch (err) {
      console.error("League data error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#006d44] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6 pb-24" dir="rtl">
      {/* Header (Image 5 Style) */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Ghiras League</h1>
        <div className="bg-[#006d44]/20 border border-[#006d44]/50 px-4 py-1 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#006d44] uppercase">Live Now</span>
        </div>
      </div>

      {/* Tournaments Scrolling (Image 5 Top Circles) */}
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar mb-8">
        {[
          { icon: "🏆", label: "البطولات" },
          { icon: "⚽", label: "المباريات" },
          { icon: "🛡️", label: "الفرق" },
          { icon: "🏅", label: "الجوائز" },
          { icon: "📊", label: "الإحصائيات" }
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 min-w-[70px]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] border-2 border-[#006d44]/40 flex items-center justify-center text-2xl shadow-lg ring-4 ring-[#006d44]/5">
              {item.icon}
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Hero Banner (Image 5 match card) */}
      <div className="relative rounded-[2.5rem] overflow-hidden mb-10 h-64 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          alt="League" 
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#006d44] text-[10px] font-black px-3 py-1 rounded-full">FINAL ROUND</span>
            <span className="text-gray-300 text-[10px] font-bold italic uppercase">Ghiras Stadium</span>
          </div>
          <h2 className="text-3xl font-black italic uppercase leading-none mb-1">Ramadan Cup 2026</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Master of the Pitch Tournament</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#1a1f2e]/50 p-1.5 rounded-2xl mb-8 border border-white/5">
        <button onClick={() => setActiveTab("ranking")} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${activeTab === "ranking" ? "bg-[#006d44] text-white shadow-xl scale-[1.02]" : "text-gray-500"}`}>ترتيب الفانتازي</button>
        <button onClick={() => setActiveTab("results")} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${activeTab === "results" ? "bg-[#006d44] text-white shadow-xl scale-[1.02]" : "text-gray-500"}`}>آخر النتائج</button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === "ranking" ? (
          standings.map((team, idx) => (
            <div key={idx} className="bg-gradient-to-r from-[#1a1f2e] to-[#0d1117] rounded-3xl p-5 flex items-center justify-between border border-white/5 hover:border-[#006d44]/30 transition-all group">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black italic text-lg shadow-inner ${idx === 0 ? "bg-yellow-400 text-black animate-pulse" : idx === 1 ? "bg-gray-300 text-black" : idx === 2 ? "bg-orange-400 text-black" : "bg-[#252a3a] text-gray-400"}`}>
                        {idx + 1}
                    </div>
                    <div>
                        <p className="font-black text-white text-sm uppercase tracking-wide group-hover:text-[#006d44] transition-colors">{team.team}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Matches Played: {team.played}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black italic text-[#006d44] leading-none">{team.points}</p>
                    <p className="text-[10px] font-black text-gray-600 uppercase">Points</p>
                </div>
            </div>
          ))
        ) : (
          matches.filter(m => m.status === "completed").map((m, idx) => (
            <div key={idx} className="bg-[#1a1f2e] rounded-3xl p-6 border border-white/5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Match Result</span>
                    <span className="text-[9px] font-black text-[#006d44] uppercase tracking-widest">Full Time</span>
                </div>
                <div className="flex items-center justify-between text-center">
                    <div className="flex-1">
                        <div className="w-14 h-14 bg-white/5 rounded-full mx-auto mb-3 flex items-center justify-center text-xl shadow-inner border border-white/5">🛡️</div>
                        <p className="text-[11px] font-black uppercase text-gray-300">{m.team1}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-baseline gap-4">
                            <span className={`text-4xl font-black italic ${m.score1 > m.score2 ? "text-[#006d44]" : "text-white"}`}>{m.score1}</span>
                            <span className="text-gray-600 font-bold">:</span>
                            <span className={`text-4xl font-black italic ${m.score2 > m.score1 ? "text-[#006d44]" : "text-white"}`}>{m.score2}</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="w-14 h-14 bg-white/5 rounded-full mx-auto mb-3 flex items-center justify-center text-xl shadow-inner border border-white/5">🛡️</div>
                        <p className="text-[11px] font-black uppercase text-gray-300">{m.team2}</p>
                    </div>
                </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav (Consistent with Home) */}
      <div className="fixed bottom-6 left-6 right-6 z-[100]">
        <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-2 shadow-2xl flex items-center justify-between overflow-hidden">
          <Link to="/" className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-white transition-colors">
            <span className="text-lg">🏠</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Home</span>
          </Link>
          <div className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400">
            <span className="text-lg">🔔</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Alerts</span>
          </div>
          <div className="w-16 h-16 -mt-10 bg-[#006d44] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#006d44]/30 border-4 border-[#070b14] ring-4 ring-white/5">
            <span className="text-2xl">⚡</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400">
            <span className="text-lg">📋</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Tasks</span>
          </div>
          <Link to="/league" className="flex-1 flex flex-col items-center gap-1 py-2 text-[#006d44]">
            <span className="text-lg">🏆</span>
            <span className="text-[8px] font-black uppercase tracking-tighter underline underline-offset-4">League</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SportsLeaguePage;
