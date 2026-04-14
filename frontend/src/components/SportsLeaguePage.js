import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function SportsLeaguePage() {
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [leagueStar, setLeagueStar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("league"); // league or fantasy

  const fetchData = useCallback(async () => {
    try {
      const [standingsRes, matchesRes, starRes, rankingsRes] = await Promise.all([
        axios.get(`${API}/league-standings`),
        axios.get(`${API}/matches`),
        axios.get(`${API}/league-star`),
        axios.get(`${API}/students/rankings`).catch(() => ({ data: [] }))
      ]);
      setStandings(Array.isArray(standingsRes.data) ? standingsRes.data : []);
      setMatches(Array.isArray(matchesRes.data) ? matchesRes.data : []);
      setLeagueStar(starRes.data?.message ? null : starRes.data);
      setRankings(Array.isArray(rankingsRes.data) ? rankingsRes.data : []);
    } catch (err) {
      console.error("Error fetching league data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upcomingMatches = matches.filter(m => m.status !== "completed");
  const completedMatches = matches.filter(m => m.status === "completed").slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6 pb-24" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </Link>
        <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">الدوري الرياضي</h1>
            <span className="text-emerald-500 text-xl">🏆</span>
        </div>
        <div className="w-10 h-10"></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button 
            onClick={() => setActiveTab("league")} 
            className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === "league" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "bg-gray-800/50 text-gray-400"}`}
        >
            ⚽ الدوري
        </button>
        <button 
            onClick={() => setActiveTab("fantasy")} 
            className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === "fantasy" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "bg-gray-800/50 text-gray-400"}`}
        >
            ⭐ الترتيب
        </button>
      </div>

      {activeTab === "league" ? (
        <div className="space-y-10">
            {/* Tournaments (Image 5) */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-emerald-500">📋</span>
                    <h2 className="text-lg font-bold">البطولات</h2>
                </div>
                <div className="relative rounded-3xl overflow-hidden group shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200" alt="League" className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent"></div>
                    <div className="absolute bottom-6 right-6">
                        <h3 className="text-2xl font-bold mb-2 italic">الدوري الرمضاني</h3>
                        <div className="flex items-center gap-2">
                            <span className="bg-emerald-500 w-2.5 h-2.5 rounded-full animate-pulse"></span>
                            <span className="text-xs font-bold text-gray-300">جارية الآن</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Upcoming Matches */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-emerald-500">⚽</span>
                    <h2 className="text-lg font-bold">المباريات القادمة</h2>
                </div>
                {upcomingMatches.length === 0 ? (
                    <div className="bg-gray-800/30 p-12 text-center rounded-3xl text-gray-500 border border-white/5">لا توجد مباريات مجدولة</div>
                ) : (
                    <div className="space-y-4">
                        {upcomingMatches.map((m, idx) => (
                            <div key={idx} className="bg-gray-800/20 rounded-3xl p-5 border border-white/5 flex items-center justify-between">
                                <div className="text-center flex-1 font-bold">{m.team1}</div>
                                <div className="bg-emerald-500/10 px-4 py-1.5 rounded-xl text-emerald-500 font-black italic">VS</div>
                                <div className="text-center flex-1 font-bold">{m.team2}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Teams (Horizontal) */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-emerald-500">👥</span>
                    <h2 className="text-lg font-bold">الفرق المشاركة</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {standings.map((t, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 shrink-0">
                            <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-emerald-500/30 flex items-center justify-center p-3 shadow-xl">
                                <div className="w-full h-full rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-black text-center leading-tight">{t.team}</div>
                            </div>
                            <span className="text-xs font-bold text-gray-400">{t.team}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Latest Results */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-emerald-500">✅</span>
                    <h2 className="text-lg font-bold">آخر النتائج</h2>
                </div>
                <div className="space-y-4">
                    {completedMatches.map((m, idx) => (
                        <div key={idx} className="bg-gray-800/40 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                            <div className="flex-1 text-center">
                                <p className="font-bold mb-1">{m.team1}</p>
                            </div>
                            <div className="px-6 flex items-center gap-4">
                                <span className={`text-3xl font-black italic ${m.score1 > m.score2 ? 'text-emerald-500' : 'text-white'}`}>{m.score1}</span>
                                <span className="w-px h-8 bg-white/10"></span>
                                <span className={`text-3xl font-black italic ${m.score2 > m.score1 ? 'text-emerald-500' : 'text-white'}`}>{m.score2}</span>
                            </div>
                            <div className="flex-1 text-center">
                                <p className="font-bold mb-1">{m.team2}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
      ) : (
        /* Fantasy Ranking Page (Image 2) */
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-emerald-500">🏆</span>
                <h2 className="text-xl font-black">ترتيب الفانتازي</h2>
            </div>
            
            <div className="space-y-4">
                {rankings.map((r, i) => (
                    <div key={r.id} className="bg-gray-800/30 rounded-[2rem] p-4 border border-white/5 flex items-center gap-4 transition-all hover:bg-gray-800/50">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${
                            i === 0 ? "bg-yellow-500 text-gray-900" : 
                            i === 1 ? "bg-gray-400 text-gray-900" : 
                            i === 2 ? "bg-amber-700 text-white" : 
                            "bg-gray-700/50 text-gray-400"
                        }`}>
                            {i + 1}
                        </div>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border border-white/10 shrink-0">
                            {r.image_url ? (
                                <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-white">{r.name}</p>
                            <p className="text-[10px] text-gray-500 font-bold">{r.supervisor || 'نادي غِراس'}</p>
                        </div>
                        <div className="text-left">
                            <div className="text-xl font-black text-yellow-500">{r.points}</div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase">نقطة</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Footer Nav for Students */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#070b14]/80 backdrop-blur-xl px-12 py-4 flex justify-between items-center border-t border-white/5 z-50">
        <Link to="/" className="text-gray-500 hover:text-emerald-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        </Link>
        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center -mt-10 shadow-lg shadow-emerald-500/20 text-white cursor-pointer active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </div>
        <button className="text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        </button>
      </div>
    </div>
  );
}

export default SportsLeaguePage;
