import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StudentAvatar = ({ student, size = "w-10 h-10", textSize = "text-sm" }) => {
  if (student.image_url) {
    const src = student.image_url.startsWith('data:') ? student.image_url : `${process.env.REACT_APP_BACKEND_URL}${student.image_url}`;
    return <img src={src} alt="" className={`${size} rounded-full object-cover border-2 border-white shadow-sm`} />;
  }
  return <div className={`${size} rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center ${textSize} font-bold text-white shadow-sm`}>{student.name?.charAt(0)}</div>;
};

function ViewerPage({ token }) {
  const [viewerName, setViewerName] = useState("");
  const [students, setStudents] = useState([]);
  const [leagueStar, setLeagueStar] = useState(null);
  const [standings, setStandings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [viewerRes, studentsRes, starRes, standingsRes, matchesRes, tasksRes] = await Promise.all([
          axios.get(`${API}/viewer/${token}`),
          axios.get(`${API}/students`),
          axios.get(`${API}/league-star`),
          axios.get(`${API}/league-standings`),
          axios.get(`${API}/matches`),
          axios.get(`${API}/tasks`)
        ]);
        setViewerName(viewerRes.data.name);
        setStudents(studentsRes.data);
        setLeagueStar(starRes.data);
        setStandings(standingsRes.data);
        setMatches(matchesRes.data);
        setTasks(tasksRes.data);
      } catch {
        setError("رابط غير صالح");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl bg-gradient-to-br from-green-50 to-emerald-50">⏳ جاري التحميل...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-xl text-red-600">❌ {error}</div>;

  const top10 = [...students].sort((a, b) => b.points - a.points).slice(0, 10);
  const pendingMatches = matches.filter(m => m.status !== "completed");
  const playedMatches = matches.filter(m => m.status === "completed");
  const pendingTasks = tasks.filter(t => t.status !== "completed");
  const supervisors = [...new Set(students.map(s => s.supervisor).filter(Boolean))];
  const rankMedals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pb-8" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-5 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold">🌱 نادي غِراس</h1>
          <p className="text-green-100 mt-1">👋 مرحباً {viewerName} - وضع المشاهدة</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 space-y-5 max-w-2xl">
        {/* League Star */}
        {leagueStar && (
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-5 text-center text-white shadow-xl">
            <p className="text-3xl">⭐</p>
            <p className="text-sm opacity-80 mb-1">نجم الدوري</p>
            {leagueStar.image_url ? (
              <img src={leagueStar.image_url.startsWith('data:') ? leagueStar.image_url : `${process.env.REACT_APP_BACKEND_URL}${leagueStar.image_url}`} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white/40 mx-auto shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mx-auto">{leagueStar.student_name?.charAt(0)}</div>
            )}
            <p className="text-xl font-bold mt-2">{leagueStar.student_name}</p>
            <p className="text-yellow-100 text-xs mt-1">✨ {leagueStar.reason}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-lg border border-green-100">
            <p className="text-2xl">👥</p>
            <div className="text-xl font-bold text-green-600">{students.length}</div>
            <div className="text-xs text-gray-500">طالب</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-lg border border-blue-100">
            <p className="text-2xl">🏅</p>
            <div className="text-xl font-bold text-blue-600">{supervisors.length}</div>
            <div className="text-xs text-gray-500">مجموعة</div>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-lg border border-purple-100">
            <p className="text-2xl">💎</p>
            <div className="text-xl font-bold text-purple-600">{students.reduce((a, s) => a + s.points, 0)}</div>
            <div className="text-xs text-gray-500">نقطة</div>
          </div>
        </div>

        {/* Top 10 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-3">
            <h2 className="font-bold text-center text-sm">🏆 أفضل 10 طلاب</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {top10.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition ${i < 3 ? "bg-yellow-50/50" : ""}`}>
                <span className="text-lg w-7 text-center">{i < 3 ? rankMedals[i] : <span className="text-gray-400 text-sm font-bold">{i + 1}</span>}</span>
                <StudentAvatar student={s} />
                <Link to={`/public/${s.id}`} className="font-semibold text-gray-800 hover:text-green-600 text-sm flex-1">{s.name}</Link>
                <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">{s.points} ⭐</span>
              </div>
            ))}
          </div>
        </div>

        {/* League Standings */}
        {standings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3">
              <h2 className="font-bold text-center text-sm">⚽ جدول الدوري الكروي</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2 text-right">الفريق</th>
                    <th className="p-2">لعب</th>
                    <th className="p-2">فاز</th>
                    <th className="p-2">تعادل</th>
                    <th className="p-2">خسر</th>
                    <th className="p-2">له</th>
                    <th className="p-2">عليه</th>
                    <th className="p-2 font-bold">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => (
                    <tr key={t.team} className={i === 0 ? "bg-yellow-50 font-bold" : i % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="p-2 text-center">{i === 0 ? "🥇" : i + 1}</td>
                      <td className="p-2 font-semibold">{t.team}</td>
                      <td className="p-2 text-center">{t.played}</td>
                      <td className="p-2 text-center text-green-600">{t.won}</td>
                      <td className="p-2 text-center text-yellow-600">{t.drawn}</td>
                      <td className="p-2 text-center text-red-600">{t.lost}</td>
                      <td className="p-2 text-center">{t.gf}</td>
                      <td className="p-2 text-center">{t.ga}</td>
                      <td className="p-2 text-center font-bold text-green-600">{t.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pending Matches */}
        {pendingMatches.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3">
              <h2 className="font-bold text-center text-sm">📅 المباريات القادمة</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingMatches.map(m => (
                <div key={m.id} className="flex items-center justify-center gap-4 p-3">
                  <span className="font-bold text-gray-800 text-sm flex-1 text-left">{m.team1}</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold text-xs">⚡ VS</span>
                  <span className="font-bold text-gray-800 text-sm flex-1 text-right">{m.team2}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Played Matches */}
        {playedMatches.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-3">
              <h2 className="font-bold text-center text-sm">📊 نتائج المباريات</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {playedMatches.map(m => (
                <div key={m.id} className="flex items-center justify-center gap-3 p-3">
                  <span className={`font-bold text-sm flex-1 text-left ${m.score1 > m.score2 ? "text-green-600" : m.score1 < m.score2 ? "text-red-500" : "text-gray-700"}`}>{m.team1}</span>
                  <span className="bg-green-600 text-white px-3 py-1 rounded-lg font-bold text-sm min-w-[60px] text-center">{m.score1} - {m.score2}</span>
                  <span className={`font-bold text-sm flex-1 text-right ${m.score2 > m.score1 ? "text-green-600" : m.score2 < m.score1 ? "text-red-500" : "text-gray-700"}`}>{m.team2}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Tasks */}
        {pendingTasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3">
              <h2 className="font-bold text-center text-sm">📋 المهام الأسبوعية</h2>
            </div>
            <div className="p-3 space-y-3">
              {supervisors.map(sup => {
                const groupTasks = pendingTasks.filter(t => t.group === sup);
                if (groupTasks.length === 0) return null;
                return (
                  <div key={sup}>
                    <p className="text-xs font-bold text-gray-500 mb-1">🏷️ {sup}</p>
                    {groupTasks.map(task => (
                      <div key={task.id} className={`p-3 rounded-xl mb-2 border ${task.claimed_by ? "border-yellow-300 bg-yellow-50" : "border-blue-200 bg-blue-50"}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800 text-sm">{task.claimed_by ? "🔒" : "📌"} {task.description}</span>
                          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">💎 {task.points}</span>
                        </div>
                        {task.claimed_by_name && <p className="text-xs text-yellow-600 mt-1">👤 حجزها: {task.claimed_by_name}</p>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Students by Group */}
        {supervisors.map(sup => {
          const groupStudents = students.filter(s => s.supervisor === sup);
          return (
            <div key={sup} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-teal-100">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-3 flex items-center justify-between">
                <h3 className="font-bold text-sm">🏅 {sup}</h3>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{groupStudents.length} طالب</span>
              </div>
              <div className="divide-y divide-gray-100">
                {groupStudents.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition">
                    <span className="text-gray-400 text-xs w-5 text-center">{i + 1}</span>
                    <StudentAvatar student={s} size="w-9 h-9" />
                    <Link to={`/public/${s.id}`} className="font-semibold text-gray-800 hover:text-green-600 text-sm flex-1">{s.name}</Link>
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{s.points} ⭐</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ViewerPage;
