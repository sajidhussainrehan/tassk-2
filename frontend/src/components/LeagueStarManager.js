import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function LeagueStarManager() {
  const [stars, setStars] = useState([]);
  const [students, setStudents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchStars = async () => {
    try {
      const res = await axios.get(`${API}/league-stars`);
      setStars(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/students`);
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStars(); fetchStudents(); }, []);

  const addStar = async (e) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedStudent);
    if (!student) return;
    setLoading(true);
    try {
      await axios.post(`${API}/league-star`, {
        student_id: student.id,
        student_name: student.name,
        image_url: student.image_url || null,
        reason
      });
      setShowAdd(false);
      setSelectedStudent(""); setReason("");
      setMessage("تم تحديث نجم الدوري");
      await fetchStars();
    } catch (err) {
      setMessage("خطأ في الإضافة");
    } finally { setLoading(false); }
  };

  const deleteStar = async (id) => {
    try {
      await axios.delete(`${API}/league-star/${id}`);
      await fetchStars();
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 3000); return () => clearTimeout(t); } }, [message]);

  const currentStar = stars[0];
  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <div className="space-y-4">
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center font-semibold">{message}</div>}

      {/* Current Star */}
      {currentStar ? (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-5 text-center text-white shadow-lg">
          <div className="text-4xl mb-2">&#9733;</div>
          <h3 className="text-sm opacity-80">نجم الدوري الحالي</h3>
          {(currentStar.image_url || currentStar.image) ? (
            <img src={(currentStar.image_url || currentStar.image).startsWith('data:') ? (currentStar.image_url || currentStar.image) : `${process.env.REACT_APP_BACKEND_URL}${currentStar.image_url || currentStar.image}`} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white/40 mx-auto mt-2 shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mx-auto mt-2">{currentStar.student_name?.charAt(0)}</div>
          )}
          <p className="text-2xl font-bold mt-2">{currentStar.student_name}</p>
          <p className="text-yellow-100 text-sm mt-1">{currentStar.reason}</p>
        </div>
      ) : (
        <div className="bg-gray-100 rounded-xl p-5 text-center text-gray-500">
          لم يتم اختيار نجم الدوري بعد
        </div>
      )}

      <button onClick={() => setShowAdd(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg font-bold" data-testid="add-star-btn">
        + تعيين نجم جديد
      </button>

      {/* History */}
      {stars.length > 1 && (
        <div className="space-y-2">
          <h4 className="font-bold text-gray-700 text-sm">السجل:</h4>
          {stars.slice(1).map(s => (
            <div key={s.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                {s.image_url ? (
                  <img src={s.image_url.startsWith('data:') ? s.image_url : `${process.env.REACT_APP_BACKEND_URL}${s.image_url}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-sm font-bold text-amber-700">{s.student_name?.charAt(0)}</div>
                )}
                <div>
                  <span className="font-semibold text-gray-700">{s.student_name}</span>
                  <span className="text-gray-400 text-sm mr-2">- {s.reason}</span>
                </div>
              </div>
              <button onClick={() => deleteStar(s.id)} className="text-red-400 hover:text-red-600 text-sm">&#10005;</button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">تعيين نجم الدوري</h3>
            <form onSubmit={addStar} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">اختر الطالب</label>
                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-amber-500" required data-testid="star-student-select">
                  <option value="">اختر الطالب</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.supervisor || 'بدون مجموعة'})</option>)}
                </select>
              </div>

              {/* Preview selected student */}
              {selectedStudentData && (
                <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  {selectedStudentData.image_url ? (
                    <img src={selectedStudentData.image_url.startsWith('data:') ? selectedStudentData.image_url : `${process.env.REACT_APP_BACKEND_URL}${selectedStudentData.image_url}`} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-amber-400" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center font-bold text-amber-700">{selectedStudentData.name.charAt(0)}</div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800">{selectedStudentData.name}</p>
                    <p className="text-sm text-gray-500">{selectedStudentData.supervisor} - {selectedStudentData.points} نقطة</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">السبب</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-amber-500" placeholder="سبب الاختيار" required data-testid="star-reason" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading || !selectedStudent} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-star">
                  {loading ? "جاري الحفظ..." : "تعيين"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeagueStarManager;
