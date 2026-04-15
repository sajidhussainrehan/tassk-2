import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function SportsLeaguePage() {
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [students, setStudents] = useState({});
  const [activeTab, setActiveTab] = useState("ranking");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [mRes, sRes, tRes, stdRes] = await Promise.all([
        axios.get(`${API}/matches`),
        axios.get(`${API}/league-standings`),
        axios.get(`${API}/teams`),
        axios.get(`${API}/students`)
      ]);
      setMatches(mRes.data || []);
      setStandings(sRes.data || []);
      setTeams(tRes.data || []);
      
      const stdMap = {};
      (stdRes.data || []).forEach(s => { stdMap[s.id] = s; });
      setStudents(stdMap);
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
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Ghiras Football</h1>
        <div className="bg-[#006d44]/20 border border-[#006d44]/50 px-4 py-1 rounded-full flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-[#006d44] uppercase">Live Now</span>
        </div>
      </div>

      {/* Tournaments Scrolling (Image 5 Top Circles) */}
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar mb-8">
        {[
          { icon: "🏆", label: "البطولات", tab: "ranking" },
          { icon: "⚽", label: "المباريات", tab: "results" },
          { icon: "🛡️", label: "الفرق", tab: "teams" },
          { icon: "🏅", label: "الجوائز", tab: "ranking" },
          { icon: "📊", label: "الإحصائيات", tab: "ranking" }
        ].map((item, idx) => (
          <button 
            key={idx} 
            onClick={() => setActiveTab(item.tab)}
            className="flex flex-col items-center gap-2 min-w-[70px] group outline-none"
          >
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] border-2 flex items-center justify-center text-2xl shadow-lg ring-4 ring-[#006d44]/5 transition-all group-hover:scale-110 active:scale-95 ${activeTab === item.tab ? "border-[#006d44] scale-105" : "border-[#006d44]/40"}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === item.tab ? "text-[#006d44]" : "text-gray-400 group-hover:text-white"}`}>{item.label}</span>
          </button>
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
          <h2 className="text-3xl font-black italic uppercase leading-none mb-1">Football League 2026</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Master of the Pitch Tournament</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#1a1f2e]/50 p-1.5 rounded-2xl mb-8 border border-white/5">
        <button onClick={() => setActiveTab("ranking")} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${activeTab === "ranking" ? "bg-[#006d44] text-white shadow-xl scale-[1.02]" : "text-gray-500"}`}>ترتيب الفانتازي</button>
        <button onClick={() => setActiveTab("results")} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${activeTab === "results" ? "bg-[#006d44] text-white shadow-xl scale-[1.02]" : "text-gray-500"}`}>آخر النتائج</button>
        <button onClick={() => setActiveTab("teams")} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${activeTab === "teams" ? "bg-[#006d44] text-white shadow-xl scale-[1.02]" : "text-gray-500"}`}>الفرق</button>
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
        ) : activeTab === "results" ? (
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
        ) : activeTab === "teams" ? (
          teams.length > 0 ? (
            teams.map((t, idx) => (
              <div key={idx} className="bg-[#1a1f2e] rounded-3xl p-6 border border-white/5 shadow-lg mb-4">
                <h3 className="text-xl font-black italic uppercase text-center mb-4 text-[#006d44]">{t.name}</h3>
                {t.group_photo && (
                  <img src={t.group_photo.startsWith('data:') ? t.group_photo : `${API_BASE}${t.group_photo}`} alt="Team" className="w-full aspect-video object-cover rounded-xl shadow-md border-2 border-[#006d44]/30 mb-6" />
                )}
                
                <div className="relative aspect-[4/5] bg-[#1a4a1a] rounded-3xl overflow-hidden border-[6px] border-[#003d24] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                  {/* Realistic Pitch Layer */}
                  <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1a4a1a] via-[#2a5a2a] to-[#1a4a1a]"></div>
                  
                  {/* Grass Stripes Pattern */}
                  <div className="absolute inset-0 flex flex-col">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black/5' : 'bg-transparent'}`}></div>
                    ))}
                  </div>

                  {/* Field Markings - Professional Style */}
                  <div className="absolute inset-6 border-4 border-white/40 pointer-events-none"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/40 shadow-sm"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white/40 rounded-full shadow-sm"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/60 rounded-full shadow-md"></div>
                  
                  {/* Goal Areas */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 h-24 border-4 border-white/40 border-t-0 bg-white/5 shadow-inner"></div>
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-12 border-4 border-white/40 border-t-0"></div>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-24 border-4 border-white/40 border-b-0 bg-white/5 shadow-inner"></div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-24 h-12 border-4 border-white/40 border-b-0"></div>
                  
                  {/* Penalty Spots */}
                  <div className="absolute top-24 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/60 rounded-full shadow-md"></div>
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/60 rounded-full shadow-md"></div>
                  
                  {/* Corners */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-l-4 border-t-4 border-white/40 rounded-tl-full"></div>
                  <div className="absolute top-6 right-6 w-8 h-8 border-r-4 border-t-4 border-white/40 rounded-tr-full"></div>
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-l-4 border-b-4 border-white/40 rounded-bl-full"></div>
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-r-4 border-b-4 border-white/40 rounded-br-full"></div>
                  
                  {/* Players (Large & Elegant) */}
                  <div className="absolute inset-0">
                    {t.lineup && t.lineup.map(player => {
                      const stdInfo = students[player.student_id] || {};
                      return (
                        <div
                          key={player.student_id}
                          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
                          style={{ left: `${player.x}%`, top: `${player.y}%` }}
                        >
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-white ring-4 ring-[#006d44]/30">
                              <img 
                                src={stdInfo.image_url ? (stdInfo.image_url.startsWith('data:') ? stdInfo.image_url : `${API_BASE}${stdInfo.image_url}`) : "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"} 
                                className="w-full h-full object-cover" 
                                alt={player.name}
                              />
                            </div>
                            <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-black text-black border-2 border-white shadow-lg">
                              {stdInfo.points || 0}
                            </div>
                          </div>
                          <p className="mt-1.5 px-3 py-0.5 bg-black/80 backdrop-blur-md text-[10px] font-black text-white rounded-full border border-white/20 shadow-lg whitespace-nowrap uppercase tracking-tighter">
                            {player.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 font-bold">لا يوجد تشكيلات للفرق بعد</div>
          )
        ) : null}
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
