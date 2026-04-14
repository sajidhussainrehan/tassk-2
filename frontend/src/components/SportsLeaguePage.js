import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function SportsLeaguePage() {
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [leagueStar, setLeagueStar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("standings");

  const fetchData = useCallback(async () => {
    try {
      const [standingsRes, matchesRes, starRes] = await Promise.all([
        axios.get(`${API}/league-standings`),
        axios.get(`${API}/matches`),
        axios.get(`${API}/league-star`)
      ]);
      setStandings(Array.isArray(standingsRes.data) ? standingsRes.data : []);
      setMatches(Array.isArray(matchesRes.data) ? matchesRes.data : []);
      setLeagueStar(starRes.data?.message ? null : starRes.data);
    } catch (err) {
      console.error("Error fetching league data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const upcomingMatches = matches.filter(m => m.status !== "completed");
  const completedMatches = matches.filter(m => m.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-xl text-white animate-pulse">⚽ جاري تحميل الدوري...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900" dir="rtl">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/20 to-transparent"></div>
        <div className="relative px-4 pt-8 pb-12 text-center">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-3xl font-black text-white mb-2">الدوري الرياضي</h1>
          <p className="text-emerald-300 text-sm font-semibold">نادي غِراس 🌱</p>
        </div>
      </div>

      {/* League Star Banner */}
      {leagueStar && (
        <div className="mx-4 -mt-4 mb-6">
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl p-4 text-center text-white shadow-xl">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">⭐</span>
              <div>
                <p className="text-xs opacity-80">نجم الدوري</p>
                {leagueStar.image_url ? (
                  <img src={leagueStar.image_url} alt="" className="w-14 h-14 rounded-full object-cover border-3 border-white/40 mx-auto my-1 shadow-lg" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mx-auto my-1">{(leagueStar.student_name || '?').charAt(0)}</div>
                )}
                <p className="text-lg font-bold">{leagueStar.student_name}</p>
                <p className="text-yellow-100 text-xs">✨ {leagueStar.reason}</p>
              </div>
              <span className="text-3xl">⭐</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 bg-gray-800/50 rounded-xl p-1">
          {[
            { id: "standings", label: "الترتيب", icon: "🏆" },
            { id: "upcoming", label: "القادمة", icon: "📅" },
            { id: "results", label: "النتائج", icon: "📊" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 max-w-lg mx-auto space-y-4">
        {/* Standings Tab */}
        {activeTab === "standings" && (
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-4">
              <h2 className="text-white font-bold text-center">🏆 جدول الترتيب</h2>
            </div>
            {standings.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-2">📊</p>
                <p>لا توجد بيانات ترتيب حتى الآن</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="p-3 text-center">#</th>
                      <th className="p-3 text-right">الفريق</th>
                      <th className="p-3 text-center">لعب</th>
                      <th className="p-3 text-center">فاز</th>
                      <th className="p-3 text-center">تعادل</th>
                      <th className="p-3 text-center">خسر</th>
                      <th className="p-3 text-center font-bold text-emerald-400">النقاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, i) => (
                      <tr key={team.team || i} className={`border-b border-gray-700/50 ${i === 0 ? "bg-yellow-500/10" : ""}`}>
                        <td className="p-3 text-center text-white font-bold">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                        </td>
                        <td className="p-3 text-white font-semibold">{team.team}</td>
                        <td className="p-3 text-center text-gray-300">{team.played}</td>
                        <td className="p-3 text-center text-green-400">{team.wins || 0}</td>
                        <td className="p-3 text-center text-yellow-400">{team.draws || 0}</td>
                        <td className="p-3 text-center text-red-400">{team.losses || 0}</td>
                        <td className="p-3 text-center font-bold text-emerald-400 text-lg">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Upcoming Matches Tab */}
        {activeTab === "upcoming" && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-center text-lg">📅 المباريات القادمة</h2>
            {upcomingMatches.length === 0 ? (
              <div className="bg-gray-800/60 rounded-2xl p-8 text-center text-gray-400 border border-gray-700">
                <p className="text-4xl mb-2">⚽</p>
                <p>لا توجد مباريات قادمة حالياً</p>
              </div>
            ) : (
              upcomingMatches.map((match, i) => (
                <div key={match.id || i} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-5 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-2xl">⚽</div>
                      <p className="text-white font-bold text-sm">{match.team1}</p>
                    </div>
                    <div className="px-4">
                      <div className="bg-gray-700 rounded-full px-4 py-2 text-center">
                        <p className="text-emerald-400 font-bold text-lg">VS</p>
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2 text-2xl">⚽</div>
                      <p className="text-white font-bold text-sm">{match.team2}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <div className="space-y-4">
            <h2 className="text-white font-bold text-center text-lg">📊 نتائج المباريات</h2>
            {completedMatches.length === 0 ? (
              <div className="bg-gray-800/60 rounded-2xl p-8 text-center text-gray-400 border border-gray-700">
                <p className="text-4xl mb-2">📋</p>
                <p>لا توجد نتائج حتى الآن</p>
              </div>
            ) : (
              completedMatches.map((match, i) => (
                <div key={match.id || i} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <p className={`font-bold text-sm ${(match.score1 || 0) > (match.score2 || 0) ? "text-emerald-400" : "text-white"}`}>{match.team1}</p>
                    </div>
                    <div className="px-3">
                      <div className="bg-gray-900 rounded-xl px-4 py-2 text-center border border-gray-600">
                        <p className="text-white font-bold text-xl">
                          <span className={(match.score1 || 0) > (match.score2 || 0) ? "text-emerald-400" : ""}>{match.score1 ?? "-"}</span>
                          <span className="text-gray-500 mx-2">:</span>
                          <span className={(match.score2 || 0) > (match.score1 || 0) ? "text-emerald-400" : ""}>{match.score2 ?? "-"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <p className={`font-bold text-sm ${(match.score2 || 0) > (match.score1 || 0) ? "text-emerald-400" : "text-white"}`}>{match.team2}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6">
        <p className="text-gray-500 text-sm">Made with ❤️ by Aboughaith</p>
      </div>
    </div>
  );
}

export default SportsLeaguePage;
