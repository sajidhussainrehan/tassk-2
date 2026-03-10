import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import RamadanQuiz from "./RamadanQuiz";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function StudentProfilePublic() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [rank, setRank] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [leagueStar, setLeagueStar] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pointsLog, setPointsLog] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, starRes, challengesRes, standingsRes] = await Promise.all([
        axios.get(`${API}/students/${studentId}/profile`),
        axios.get(`${API}/league-star`),
        axios.get(`${API}/challenges/active`),
        axios.get(`${API}/league-standings`)
      ]);
      setStudent(profileRes.data.student);
      setRank(profileRes.data.rank);
      setTotalStudents(profileRes.data.total_students);
      setLeagueStar(starRes.data);
      setChallenges(challengesRes.data);
      setStandings(standingsRes.data);

      // Fetch tasks for student's group
      const group = profileRes.data.student.supervisor;
      if (group) {
        const tasksRes = await axios.get(`${API}/tasks?group=${encodeURIComponent(group)}`);
        setTasks(tasksRes.data.filter(t => !t.completed && (!t.claimed_by || t.claimed_by === studentId)));
      }

      // Fetch points log
      const logRes = await axios.get(`${API}/points-log/${studentId}`);
      setPointsLog(logRes.data);
    } catch {
      setError("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showMsg = (msg) => { setMessage(msg); setTimeout(() => setMessage(""), 3000); };

  const claimTask = async (taskId) => {
    try {
      await axios.post(`${API}/tasks/${taskId}/claim/${studentId}`);
      showMsg("تم حجز المهمة بنجاح");
      await fetchData();
    } catch (err) {
      showMsg(err.response?.data?.detail || "خطأ في حجز المهمة");
    }
  };

  const answerChallenge = async (challengeId, answer) => {
    try {
      const res = await axios.post(`${API}/challenges/${challengeId}/answer/${studentId}`, { answer });
      if (res.data.correct) {
        showMsg(`إجابة صحيحة! +${res.data.points_earned} نقطة`);
      } else {
        showMsg("إجابة خاطئة");
      }
      await fetchData();
    } catch (err) {
      showMsg(err.response?.data?.detail || "خطأ");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50"><div className="text-xl text-gray-600">⏳ جاري التحميل...</div></div>;
  if (error || !student) return <div className="min-h-screen flex items-center justify-center bg-red-50"><div className="text-xl text-red-600">❌ {error || "الطالب غير موجود"}</div></div>;

  const answeredChallenges = student.answered_challenges || [];
  const availableChallenges = challenges.filter(c => !answeredChallenges.includes(c.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 pb-8" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white pt-6 pb-16 px-4">
        <h1 className="text-center text-lg font-bold mb-6">🌱 نادي غِراس</h1>
        <div className="flex flex-col items-center">
          {student.image_url ? (
            <img src={student.image_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-white/30 shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold shadow-lg">{student.name.charAt(0)}</div>
          )}
          <h2 className="text-2xl font-bold mt-3" data-testid="student-name">{student.name}</h2>
          {student.supervisor && <p className="text-green-100 text-sm mt-1">🏅 {student.supervisor}</p>}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="container mx-auto px-4 -mt-6">
          <div className="bg-white border-r-4 border-green-500 text-green-700 p-3 rounded-lg shadow text-center font-semibold animate-fadeIn">{message}</div>
        </div>
      )}

      <div className="container mx-auto px-4 -mt-10 space-y-4 max-w-lg">
        {/* 1. League Star */}
        {leagueStar && (
          <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-4 text-center text-white shadow-xl" data-testid="league-star-banner">
            <p className="text-3xl">⭐</p>
            <p className="text-sm opacity-80">نجم الدوري</p>
            {leagueStar.image_url ? (
              <img src={leagueStar.image_url} alt="" className="w-16 h-16 rounded-full object-cover border-4 border-white/40 mx-auto mt-1 shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mx-auto mt-1">{leagueStar.student_name?.charAt(0)}</div>
            )}
            <p className="text-xl font-bold mt-1">{leagueStar.student_name}</p>
            <p className="text-yellow-100 text-xs">✨ {leagueStar.reason}</p>
          </div>
        )}

        {/* 2. Rank & Points */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-xl border border-green-100">
            <p className="text-2xl">🏆</p>
            <div className="text-3xl font-bold text-green-600" data-testid="student-rank">{rank}</div>
            <div className="text-xs text-gray-500">الترتيب من {totalStudents}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-xl border border-blue-100">
            <p className="text-2xl">💎</p>
            <div className="text-3xl font-bold text-blue-600" data-testid="student-points">{student.points}</div>
            <div className="text-xs text-gray-500">نقطة</div>
          </div>
        </div>

        {/* League Standings */}
        {standings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3">
              <h3 className="font-bold text-center text-sm">⚽ جدول الدوري الكروي</h3>
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
                    <th className="p-2 font-bold">النقاط</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => (
                    <tr key={t.team} className={`${t.team === student.supervisor ? "bg-green-50 font-bold" : i % 2 === 0 ? "bg-gray-50" : ""}`}>
                      <td className="p-2 text-center">{i === 0 ? "🥇" : i + 1}</td>
                      <td className="p-2 font-semibold">{t.team}</td>
                      <td className="p-2 text-center">{t.played}</td>
                      <td className="p-2 text-center">{t.won}</td>
                      <td className="p-2 text-center">{t.drawn}</td>
                      <td className="p-2 text-center">{t.lost}</td>
                      <td className="p-2 text-center font-bold text-green-600">{t.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ramadan Quiz */}
        <RamadanQuiz studentId={studentId} />

        {/* 3. Challenges */}
        {availableChallenges.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3">
              <h3 className="font-bold text-center text-sm">🏆 المنافسات المتاحة</h3>
            </div>
            <div className="p-4 space-y-4">
              {availableChallenges.map(c => (
                <ChallengeCard key={c.id} challenge={c} onAnswer={(ans) => answerChallenge(c.id, ans)} />
              ))}
            </div>
          </div>
        )}

        {/* 4. Weekly Tasks */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3">
              <h3 className="font-bold text-center text-sm">📋 المهام الأسبوعية</h3>
            </div>
            <div className="p-4 space-y-3">
              {tasks.map(task => (
                <div key={task.id} className={`p-3 rounded-xl border ${task.claimed_by === studentId ? "border-yellow-400 bg-yellow-50" : "border-blue-200 bg-blue-50"}`}>
                  <p className="font-semibold text-gray-800 text-sm">{task.claimed_by === studentId ? "🔒" : "📌"} {task.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">💎 {task.points} نقطة</span>
                    {task.claimed_by === studentId ? (
                      <span className="text-yellow-600 text-xs font-bold">⏳ في انتظار اعتماد المشرف</span>
                    ) : !task.claimed_by ? (
                      <button onClick={() => claimTask(task.id)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold" data-testid={`claim-task-${task.id}`}>
                        ✋ احجز المهمة
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Points Log */}
        {pointsLog.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-3">
              <h3 className="font-bold text-center text-sm">📊 سجل النقاط</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {pointsLog.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{log.points > 0 ? "✅" : "❌"} {log.reason}</p>
                    <p className="text-xs text-gray-400">📅 {formatDate(log.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${log.points > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {log.points > 0 ? "+" : ""}{log.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  const handleAnswer = () => {
    if (selected === null) return;
    setAnswered(true);
    onAnswer(selected);
  };

  return (
    <div className="border rounded-lg p-3">
      <p className="font-bold text-sm mb-2">{challenge.question}</p>
      <div className="space-y-2">
        {challenge.options.map((opt, i) => (
          <button key={i} onClick={() => !answered && setSelected(i)}
            className={`w-full text-right p-2 rounded-lg text-sm border transition ${selected === i ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:bg-gray-50"} ${answered ? "opacity-75 cursor-not-allowed" : ""}`}
            disabled={answered}
          >
            {opt}
          </button>
        ))}
      </div>
      {!answered && (
        <button onClick={handleAnswer} disabled={selected === null}
          className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50">
          تأكيد الإجابة
        </button>
      )}
      <div className="text-center mt-1">
        <span className="text-xs text-purple-600 font-bold">{challenge.points} نقطة</span>
      </div>
    </div>
  );
}

export default StudentProfilePublic;
