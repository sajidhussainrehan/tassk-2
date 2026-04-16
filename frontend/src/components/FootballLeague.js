import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
      setMatches(matchRes.data);
      setStandings(standRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const addMatch = async (e) => {
    e.preventDefault();
    if (team1 === team2) { setMessage("لا يمكن اختيار نفس الفريق"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/matches`, { team1, team2 });
      setShowAddMatch(false);
      setTeam1(""); setTeam2("");
      setMessage("تمت جدولة المباراة");
      await fetchData();
    } catch (err) {
      setMessage("خطأ في إضافة المباراة");
    } finally { setLoading(false); }
  };

  const updateScore = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/matches/${showScoreModal.id}/score`, { score1, score2 });
      setShowScoreModal(null);
      setScore1(0); setScore2(0);
      setMessage("تم تحديث النتيجة");
      await fetchData();
    } catch (err) {
      setMessage("خطأ في تحديث النتيجة");
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
    <div className="space-y-4">
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center font-semibold">{message}</div>}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab("standings")} className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeTab === "standings" ? "bg-green-600 text-white" : "bg-white text-gray-600 shadow"}`}>🏆 جدول الترتيب</button>
        <button onClick={() => setActiveTab("pending")} className={`flex-1 py-2 rounded-lg font-bold text-sm relative ${activeTab === "pending" ? "bg-blue-600 text-white" : "bg-white text-gray-600 shadow"}`}>
          📅 المباريات القادمة
          {pendingMatches.length > 0 && <span className="absolute -top-1 -left-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{pendingMatches.length}</span>}
        </button>
        <button onClick={() => setActiveTab("played")} className={`flex-1 py-2 rounded-lg font-bold text-sm ${activeTab === "played" ? "bg-gray-600 text-white" : "bg-white text-gray-600 shadow"}`}>📊 النتائج</button>
      </div>

      <button onClick={() => setShowAddMatch(true)} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm" data-testid="add-match-btn">
        ⚽ جدولة مباراة جديدة
      </button>

      {/* Standings Tab */}
      {activeTab === "standings" && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3">
            <h2 className="font-bold text-center">⚽ جدول الدوري</h2>
          </div>
          {standings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2 text-right">الفريق</th>
                    <th className="p-2">لعب</th>
                    <th className="p-2">فاز</th>
                    <th className="p-2">تعادل</th>
                    <th className="p-2">خسر</th>
                    <th className="p-2 font-bold">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => (
                    <tr key={t.team} className={i === 0 ? "bg-yellow-50 font-bold" : i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="p-2 text-center">{i === 0 ? "🥇" : i + 1}</td>
                      <td className="p-2 font-semibold">{t.team}</td>
                      <td className="p-2 text-center">{t.played}</td>
                      <td className="px-2 py-3 text-center font-bold text-green-600">{t.wins || 0}</td>
                      <td className="px-2 py-3 text-center font-bold text-gray-600">{t.draws || 0}</td>
                      <td className="px-2 py-3 text-center font-bold text-red-600">{t.losses || 0}</td>
                      <td className="p-2 text-center font-bold text-green-600 text-lg">{t.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">لا توجد نتائج بعد</div>
          )}
        </div>
      )}

      {/* Pending Matches Tab */}
      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingMatches.length > 0 ? pendingMatches.map(m => (
            <div key={m.id} className="bg-white rounded-xl shadow p-4 border-r-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center justify-center gap-3">
                  <span className="font-bold text-gray-800 text-sm">{m.team1}</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm">⚡ VS</span>
                  <span className="font-bold text-gray-800 text-sm">{m.team2}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openScoreModal(m)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold" data-testid={`score-btn-${m.id}`}>
                    إدخال النتيجة
                  </button>
                  <button onClick={() => deleteMatch(m.id)} className="text-red-400 hover:text-red-600 text-lg">&#10005;</button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">لا توجد مباريات قادمة</div>
          )}
        </div>
      )}

      {/* Played Matches Tab */}
      {activeTab === "played" && (
        <div className="space-y-3">
          {playedMatches.length > 0 ? playedMatches.map(m => (
            <div key={m.id} className="bg-white rounded-xl shadow p-4 border-r-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center justify-center gap-3">
                  <span className={`font-bold text-sm ${m.score1 > m.score2 ? "text-green-600" : m.score1 < m.score2 ? "text-red-600" : "text-gray-800"}`}>{m.team1}</span>
                  <span className="bg-green-600 text-white px-3 py-1 rounded-lg font-bold min-w-[70px] text-center text-sm">
                    {m.score1} - {m.score2}
                  </span>
                  <span className={`font-bold text-sm ${m.score2 > m.score1 ? "text-green-600" : m.score2 < m.score1 ? "text-red-600" : "text-gray-800"}`}>{m.team2}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openScoreModal(m)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs font-semibold">تعديل</button>
                  <button onClick={() => deleteMatch(m.id)} className="text-red-400 hover:text-red-600 text-sm">&#10005;</button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-gray-500">لا توجد نتائج بعد</div>
          )}
        </div>
      )}

      {/* Add Match Modal */}
      {showAddMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddMatch(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">جدولة مباراة جديدة</h3>
            <form onSubmit={addMatch} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">الفريق الأول</label>
                <select value={team1} onChange={e => setTeam1(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" required data-testid="match-team1">
                  <option value="">اختر الفريق</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">الفريق الثاني</label>
                <select value={team2} onChange={e => setTeam2(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" required data-testid="match-team2">
                  <option value="">اختر الفريق</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-match">
                  {loading ? "جاري الحفظ..." : "جدولة المباراة"}
                </button>
                <button type="button" onClick={() => setShowAddMatch(false)} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowScoreModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-lg font-bold mb-4 text-center">إدخال النتيجة</h3>
            <div className="text-center mb-4">
              <span className="font-bold text-gray-800">{showScoreModal.team1}</span>
              <span className="mx-3 text-gray-400">VS</span>
              <span className="font-bold text-gray-800">{showScoreModal.team2}</span>
            </div>
            <form onSubmit={updateScore} className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1 text-center">
                  <label className="block text-xs font-semibold mb-1 text-gray-500">{showScoreModal.team1}</label>
                  <input type="number" min="0" value={score1} onChange={e => setScore1(parseInt(e.target.value) || 0)} className="w-full px-3 py-3 border-2 rounded-lg text-center text-2xl font-bold focus:outline-none focus:border-green-500" data-testid="score-input-1" />
                </div>
                <span className="text-2xl font-bold text-gray-400 pt-4">-</span>
                <div className="flex-1 text-center">
                  <label className="block text-xs font-semibold mb-1 text-gray-500">{showScoreModal.team2}</label>
                  <input type="number" min="0" value={score2} onChange={e => setScore2(parseInt(e.target.value) || 0)} className="w-full px-3 py-3 border-2 rounded-lg text-center text-2xl font-bold focus:outline-none focus:border-green-500" data-testid="score-input-2" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-score">
                  {loading ? "جاري الحفظ..." : "حفظ النتيجة"}
                </button>
                <button type="button" onClick={() => setShowScoreModal(null)} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FootballLeague;
