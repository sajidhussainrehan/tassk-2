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
  const [activeTab, setActiveTab] = useState("students");
  const [leagueStar, setLeagueStar] = useState(null);

  const fetchData = async () => {
    try {
      const [studentsRes, tasksRes, matchesRes, standingsRes, starRes] = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/tasks`),
        axios.get(`${API}/matches`),
        axios.get(`${API}/league-standings`),
        axios.get(`${API}/league-star`).catch(() => ({ data: null }))
      ]);
      setStudents(studentsRes.data);
      setTasks(tasksRes.data);
      setMatches(matchesRes.data);
      setStandings(standingsRes.data);
      setLeagueStar(starRes.data);
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

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">{selectedStudent.points}</p>
                  <p className="text-sm text-gray-600">النقاط</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {students.findIndex(s => s.id === selectedStudent.id) + 1}
                  </p>
                  <p className="text-sm text-gray-600">الترتيب</p>
                </div>
              </div>

              {/* Halaqa Grades */}
              {halaqaHistory.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold text-gray-700 mb-2">📚 درجات الحلقة</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {halaqaHistory.map((grade) => (
                      <div key={grade.id} className="bg-emerald-50 p-3 rounded-lg text-sm">
                        <p className="font-semibold">
                          حفظ: {grade.memorization} | مراجعة: {grade.revision} | متون: {grade.mutun}
                        </p>
                        <p className="text-xs text-gray-500">المجموع: {grade.total_points} نقطة</p>
                        {grade.notes && <p className="text-xs text-gray-600 mt-1">📝 {grade.notes}</p>}
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
    </div>
  );
}

export default ViewOnlyDashboard;
