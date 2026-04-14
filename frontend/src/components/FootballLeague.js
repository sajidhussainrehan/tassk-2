import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function FootballLeague({ supervisors }) {
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(null);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("standings");

  const fetchData = async () => {
    try {
      const [matchRes, standRes] = await Promise.all([
        axios.get(`${API}/matches`),
        axios.get(`${API}/league-standings`)
      ]);
      setMatches(matchRes.data || []);
      setStandings(standRes.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const addMatch = async (e) => {
    e.preventDefault();
    if (team1 === team2) { setMessage("❌ لا يمكن اختيار نفس الفريق"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/matches`, { team1, team2 });
      setShowAddMatch(false);
      setTeam1(""); setTeam2("");
      setMessage("✅ تم جدولة المباراة بنجاح");
      await fetchData();
    } catch (err) {
      setMessage("❌ خطأ في إضافة المباراة");
    } finally { setLoading(false); }
  };

  const updateScore = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/matches/${showScoreModal.id}/score`, { score1, score2 });
      setShowScoreModal(null);
      setScore1(0); setScore2(0);
      setMessage("✅ تم تحديث النتيجة بنجاح");
      await fetchData();
    } catch (err) {
      setMessage("❌ خطأ في تحديث النتيجة");
    } finally { setLoading(false); }
  };

  const deleteMatch = async (id) => {
    if (!window.confirm("حذف هذه المباراة؟")) return;
    try {
      await axios.delete(`${API}/matches/${id}`);
      await fetchData();
    } catch (err) { console.error(err); }
  };

  const openScoreModal = (match) => {
    setScore1(match.score1 || 0);
    setScore2(match.score2 || 0);
    setShowScoreModal(match);
  };

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 3000); return () => clearTimeout(t); } }, [message]);

  const pendingMatches = matches.filter(m => m.status !== "completed");
  const playedMatches = matches.filter(m => m.status === "completed");

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-2xl text-center font-bold animate-fadeIn shadow-lg ${message.startsWith('✅') ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-3 bg-white/50 p-1.5 rounded-2xl shadow-inner border border-gray-100">
        <button onClick={() => setActiveTab("standings")} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === "standings" ? "bg-[#006d44] text-white shadow-lg" : "text-gray-500 hover:bg-gray-100"}`}>🏆 الترتيب</button>
        <button onClick={() => setActiveTab("pending")} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all relative ${activeTab === "pending" ? "bg-[#006d44] text-white shadow-lg" : "text-gray-500 hover:bg-gray-100"}`}>
            📅 القادمة
            {pendingMatches.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center border-2 border-white">{pendingMatches.length}</span>}
        </button>
        <button onClick={() => setActiveTab("played")} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === "played" ? "bg-[#006d44] text-white shadow-lg" : "text-gray-500 hover:bg-gray-100"}`}>📊 النتائج</button>
      </div>

      <button onClick={() => setShowAddMatch(true)} className="w-full bg-[#006d44] hover:bg-[#004e31] text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2">
        <span className="text-xl">⚽</span>
        جدولة مباراة جديدة
      </button>

      {/* Standings */}
      {activeTab === "standings" && (
        <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100 overflow-hidden border border-gray-50 animate-fadeIn">
          <div className="bg-gradient-to-r from-[#006d44] to-[#014029] text-white p-6">
            <h2 className="font-black text-center text-lg italic uppercase tracking-wider">League Standings</h2>
          </div>
          {standings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="p-4 text-center font-black text-gray-400 text-xs text-right">#</th>
                    <th className="p-4 text-right font-black text-gray-400 text-xs">الفريق</th>
                    <th className="p-4 text-center font-black text-gray-400 text-xs">لعب</th>
                    <th className="p-4 text-center font-black text-gray-400 text-xs">فاز</th>
                    <th className="p-4 text-center font-black text-gray-400 text-xs">خسر</th>
                    <th className="p-4 text-center font-black text-[#006d44] text-xs">نقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => (
                    <tr key={t.team} className={`border-b border-gray-50 transition-colors hover:bg-emerald-50/30 ${i === 0 ? "bg-emerald-50/50" : ""}`}>
                      <td className="p-4 text-center">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? "bg-yellow-400 text-white" : "text-gray-400 bg-gray-100"}`}>
                            {i === 0 ? "🥇" : i + 1}
                        </span>
                      </td>
                      <td className="p-4 font-black text-gray-800">{t.team}</td>
                      <td className="p-4 text-center font-bold text-gray-500">{t.played}</td>
                      <td className="p-4 text-center font-black text-emerald-600">{t.wins || 0}</td>
                      <td className="p-4 text-center font-black text-red-500">{t.losses || 0}</td>
                      <td className="p-4 text-center">
                        <span className="font-black text-lg text-[#006d44]">{t.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400 font-bold italic">No data yet</div>
          )}
        </div>
      )}

      {/* Pending Matches */}
      {activeTab === "pending" && (
        <div className="space-y-4 animate-fadeIn">
          {pendingMatches.map(m => (
            <div key={m.id} className="bg-white rounded-3xl p-6 shadow-md border-r-8 border-[#006d44] group hover:shadow-lg transition-all">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center justify-center gap-4">
                  <span className="font-black text-gray-800 text-center flex-1">{m.team1}</span>
                  <div className="bg-emerald-50 text-[#006d44] px-4 py-2 rounded-2xl font-black italic text-xs border border-emerald-100">VS</div>
                  <span className="font-black text-gray-800 text-center flex-1">{m.team2}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openScoreModal(m)} className="bg-[#006d44] text-white p-3 rounded-xl font-black text-xs shadow-md transition-all active:scale-95">النتيجة</button>
                  <button onClick={() => deleteMatch(m.id)} className="text-red-300 hover:text-red-500 p-2">✕</button>
                </div>
              </div>
            </div>
          ))}
          {pendingMatches.length === 0 && <div className="text-center py-20 text-gray-300 font-black italic">لا يوجد مباريات مجدولة</div>}
        </div>
      )}

      {/* Results */}
      {activeTab === "played" && (
        <div className="space-y-4 animate-fadeIn">
          {playedMatches.map(m => (
            <div key={m.id} className="bg-white rounded-3xl p-8 shadow-md border-r-8 border-gray-400 group hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center font-black text-gray-800">{m.team1}</div>
                <div className="px-8 flex items-center gap-4">
                    <span className={`text-4xl font-black italic ${m.score1 > m.score2 ? 'text-emerald-600' : 'text-gray-800'}`}>{m.score1}</span>
                    <span className="w-px h-10 bg-gray-100"></span>
                    <span className={`text-4xl font-black italic ${m.score2 > m.score1 ? 'text-emerald-600' : 'text-gray-800'}`}>{m.score2}</span>
                </div>
                <div className="flex-1 text-center font-black text-gray-800">{m.team2}</div>
                <div className="mr-6 flex gap-2">
                    <button onClick={() => openScoreModal(m)} className="text-gray-300 hover:text-gray-600">تعديل</button>
                    <button onClick={() => deleteMatch(m.id)} className="text-red-200 hover:text-red-400">✕</button>
                </div>
              </div>
            </div>
          ))}
          {playedMatches.length === 0 && <div className="text-center py-20 text-gray-300 font-black italic">No results yet</div>}
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-fadeIn" onClick={() => setShowScoreModal(null)}>
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative" onClick={e => e.stopPropagation()} dir="rtl">
            <button onClick={() => setShowScoreModal(null)} className="absolute top-8 left-8 text-gray-400 text-2xl">✕</button>
            <h3 className="text-2xl font-black text-gray-800 mb-10 text-center">تحديث نتيجة المباراة</h3>
            
            <form onSubmit={updateScore} className="space-y-8">
              <div className="flex items-center justify-center gap-10">
                <div className="text-center flex-1">
                    <p className="font-black text-gray-800 mb-4">{showScoreModal.team1}</p>
                    <input type="number" value={score1} onChange={e => setScore1(parseInt(e.target.value))} className="w-24 h-24 text-center text-4xl font-black bg-gray-50 border-4 border-transparent focus:border-[#006d44] rounded-3xl outline-none transition-all shadow-inner" required />
                </div>
                <div className="font-black text-4xl text-gray-200 mt-10">VS</div>
                <div className="text-center flex-1">
                    <p className="font-black text-gray-800 mb-4">{showScoreModal.team2}</p>
                    <input type="number" value={score2} onChange={e => setScore2(parseInt(e.target.value))} className="w-24 h-24 text-center text-4xl font-black bg-gray-50 border-4 border-transparent focus:border-[#006d44] rounded-3xl outline-none transition-all shadow-inner" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#006d44] text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-[#004e31] transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'جاري الحفظ...' : 'حفظ النتيجة النهائية'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Match Modal */}
      {showAddMatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-fadeIn" onClick={() => setShowAddMatch(false)}>
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-lg shadow-2xl relative" onClick={e => e.stopPropagation()} dir="rtl">
            <button onClick={() => setShowAddMatch(false)} className="absolute top-8 left-8 text-gray-400 text-2xl">✕</button>
            <h3 className="text-2xl font-black text-gray-800 mb-8">جدولة مباراة جديدة</h3>
            <form onSubmit={addMatch} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 mr-2 uppercase tracking-widest">الفريق الأول</label>
                  <select value={team1} onChange={e => setTeam1(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl focus:border-[#006d44] outline-none font-bold" required>
                    <option value="">اختر الفريق</option>
                    {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 mr-2 uppercase tracking-widest">الفريق الثاني</label>
                  <select value={team2} onChange={e => setTeam2(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border-2 rounded-2xl focus:border-[#006d44] outline-none font-bold" required>
                    <option value="">اختر الفريق</option>
                    {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#006d44] text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-200 transition-all active:scale-95">
                  {loading ? 'جاري الجدولة...' : 'تأكيد جدولة المباراة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FootballLeague;
