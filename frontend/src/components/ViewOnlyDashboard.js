import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ViewOnlyDashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [halaqaHistory, setHalaqaHistory] = useState([]);
  const [pointsLog, setPointsLog] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [activeTab, setActiveTab] = useState("students");
  const [leagueStar, setLeagueStar] = useState(null);

  const fetchData = async () => {
    try {
      const [studentsRes, tasksRes, matchesRes, standingsRes, starRes, competitionsRes] = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/matches`),
        axios.get(`${API}/league-standings`),
        axios.get(`${API}/league-star`).catch(() => ({ data: null })),
        axios.get(`${API}/competitions`).catch(() => ({ data: [] }))
      ]);
      setStudents(studentsRes.data);
      setTasks(tasksRes.data);
      setMatches(matchesRes.data);
      setStandings(standingsRes.data);
      setLeagueStar(starRes.data);
      setCompetitions(competitionsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchStudentDetails = async (student) => {
    setSelectedStudent(student);
    try {
      const [halaqaRes, logRes] = await Promise.all([
        axios.get(`${API}/halaqa-grades/${student.id}`),
        axios.get(`${API}/points-log/${student.id}`)
      ]);
      setHalaqaHistory(halaquaRes.data);
      setPointsLog(logRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ar-SA");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👁️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">وضع المشاهدة فقط</h1>
                <p className="text-blue-100 text-sm">View-Only Mode</p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              🚪 خروج
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "students", label: "👨‍🎓 الطلاب", icon: "👨‍🎓" },
            { id: "standings", label: "🏆 الترتيب", icon: "🏆" },
            { id: "tasks", label: "📋 المهام", icon: "📋" },
            { id: "matches", label: "⚽ المباريات", icon: "⚽" },
            { id: "competitions", label: "🎯 المسابقات", icon: "🎯" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition ${
                activeTab === tab.id 
                  ? "bg-blue-600 text-white" 
                  : "bg-white text-gray-700 hover:bg-blue-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="grid gap-4">
            {students.sort((a, b) => b.points - a.points).map((student, index) => (
              <div 
                key={student.id} 
                onClick={() => fetchStudentDetails(student)}
                className="bg-white rounded-xl p-4 shadow-md cursor-pointer hover:shadow-lg transition border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? "bg-yellow-100 text-yellow-700" :
                      index === 1 ? "bg-gray-200 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {index + 1}
                    </div>
                    {student.image_url ? (
                      <img src={student.image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-lg">
                        {student.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800">{student.name}</h3>
                      <p className="text-sm text-gray-500">{student.supervisor || "بدون مجموعة"}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                      {student.points} ⭐
                    </span>
                    <p className="text-xs text-gray-400 mt-1">نقطة</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === "standings" && (
          <div className="space-y-6">
            {/* League Star */}
            {leagueStar && leagueStar.student_name && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">⭐</span>
                  <div>
                    <p className="text-sm opacity-90">نجم الأسبوع</p>
                    <p className="font-bold text-lg">{leagueStar.student_name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* League Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-blue-600 text-white p-4">
                <h2 className="font-bold">🏆 جدول الدوري</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3 text-right">الفريق</th>
                      <th className="p-3">لعب</th>
                      <th className="p-3">فاز</th>
                      <th className="p-3">تعادل</th>
                      <th className="p-3">خسر</th>
                      <th className="p-3 font-bold">النقاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, i) => (
                      <tr key={team.team} className={i === 0 ? "bg-yellow-50" : i % 2 === 0 ? "bg-gray-50" : ""}>
                        <td className="p-3 text-center">{i === 0 ? "🥇" : i + 1}</td>
                        <td className="p-3 font-semibold">{team.team}</td>
                        <td className="p-3 text-center">{team.played}</td>
                        <td className="p-3 text-center text-green-600">{team.won}</td>
                        <td className="p-3 text-center text-yellow-600">{team.drawn}</td>
                        <td className="p-3 text-center text-red-600">{team.lost}</td>
                        <td className="p-3 text-center font-bold text-blue-600">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="font-bold">📋 المهام الأسبوعية</h2>
            </div>
            <div className="p-4 space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`p-4 rounded-lg border ${
                    task.status === "completed" ? "bg-green-50 border-green-200" :
                    task.status === "awaiting_approval" ? "bg-orange-50 border-orange-200" :
                    task.claimed_by ? "bg-yellow-50 border-yellow-200" :
                    "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{task.description}</p>
                      <p className="text-sm text-gray-500">المجموعة: {task.group}</p>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-bold">
                      {task.points} نقطة
                    </span>
                  </div>
                  {task.claimed_by_name && (
                    <p className="text-sm mt-2">
                      {task.status === "completed" ? "✅" : task.status === "awaiting_approval" ? "⏳" : "🔒"} 
                      {" "}{task.claimed_by_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === "matches" && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="font-bold">⚽ مباريات الدوري</h2>
            </div>
            <div className="p-4 space-y-3">
              {matches.map((match) => (
                <div key={match.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex-1 text-center">
                      <p className="font-bold text-lg">{match.team1}</p>
                    </div>
                    <div className="px-4">
                      {match.status === "completed" ? (
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xl">
                          {match.score1} - {match.score2}
                        </div>
                      ) : (
                        <div className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold">
                          VS
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center">
                      <p className="font-bold text-lg">{match.team2}</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {match.status === "completed" ? "✅ انتهت" : "⏳ لم تبدأ"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitions Tab */}
        {activeTab === "competitions" && (
          <div className="bg-white rounded-xl shadow-lg">
            <div className="bg-blue-600 text-white p-4">
              <h2 className="font-bold">🎯 المسابقات المتاحة</h2>
            </div>
            <div className="p-4 space-y-3">
              {competitions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-2">🏆</p>
                  <p>لا توجد مسابقات حالياً</p>
                </div>
              ) : (
                competitions.map((comp) => (
                  <div 
                    key={comp.id} 
                    className={`p-4 rounded-lg border ${
                      comp.status === "active" ? "bg-green-50 border-green-200" :
                      comp.status === "completed" ? "bg-gray-50 border-gray-200" :
                      "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{comp.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{comp.description}</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          <span>📅 {comp.date || "-"}</span>
                          <span>👥 {comp.participants_count || 0} مشارك</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                          💎 {comp.points} نقطة
                        </span>
                        <p className={`text-xs mt-1 font-semibold ${
                          comp.status === "active" ? "text-green-600" :
                          comp.status === "completed" ? "text-gray-500" :
                          "text-yellow-600"
                        }`}>
                          {comp.status === "active" ? "✅ نشطة" :
                           comp.status === "completed" ? "✅ منتهية" :
                           "⏳ قريباً"}
                        </p>
                      </div>
                    </div>
                    {comp.winner_name && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          🏆 الفائز: <span className="font-bold">{comp.winner_name}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Student Details Modal */}
        {selectedStudent && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
            onClick={() => setSelectedStudent(null)}
          >
            <div 
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                {selectedStudent.image_url ? (
                  <img 
                    src={selectedStudent.image_url} 
                    alt="" 
                    className="w-16 h-16 rounded-full object-cover border-4 border-blue-200" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl border-4 border-blue-200">
                    {selectedStudent.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-gray-500">{selectedStudent.supervisor || "بدون مجموعة"}</p>
                </div>
              </div>

              {/* Points Summary */}
              <div className="mb-6">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-700">{selectedStudent.points}</p>
                    <p className="text-xs text-gray-600">إجمالي النقاط</p>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg text-center border-2 border-emerald-200">
                    <p className="text-2xl font-bold text-emerald-700">
                      {halaqaHistory.reduce((sum, g) => sum + (g.total_points || 0), 0)}
                    </p>
                    <p className="text-xs text-emerald-600">نقاط القرآن 📚</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {students.findIndex(s => s.id === selectedStudent.id) + 1}
                    </p>
                    <p className="text-xs text-gray-600">الترتيب</p>
                  </div>
                </div>
              </div>

              {/* Halaqa Grades Details */}
              {halaqaHistory.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold text-emerald-700 mb-2 flex items-center gap-2">
                    📚 درجات الحلقة (قرآن)
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {halaqaHistory.map((grade) => (
                      <div key={grade.id} className="bg-emerald-50 p-3 rounded-lg text-sm border border-emerald-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-emerald-800">📖 {grade.student_name}</span>
                          <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">
                            +{grade.total_points} نقطة
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-600">
                          <span>📝 حفظ: <b>{grade.memorization}</b></span>
                          <span>🔄 مراجعة: <b>{grade.revision}</b></span>
                          <span>📜 متون: <b>{grade.mutun}</b></span>
                        </div>
                        {grade.notes && <p className="text-xs text-gray-500 mt-1">� {grade.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Points Log */}
              {pointsLog.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">📊 سجل النقاط</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pointsLog.slice(0, 10).map((log, i) => (
                      <div key={i} className="bg-gray-50 p-2 rounded text-sm flex justify-between">
                        <span>{log.reason}</span>
                        <span className={log.points > 0 ? "text-green-600" : "text-red-600"}>
                          {log.points > 0 ? "+" : ""}{log.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Made with Aboughaith Badge */}
      <div className="fixed bottom-4 left-4 z-50">
        <a href="#" className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span className="text-xs font-medium">by Aboughaith</span>
        </a>
      </div>
    </div>
  );
}

export default ViewOnlyDashboard;
