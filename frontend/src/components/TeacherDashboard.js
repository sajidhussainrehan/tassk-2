import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function TeacherDashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [message, setMessage] = useState("");
  const [halaqaHistory, setHalaqaHistory] = useState([]);

  // Grade form
  const [memorization, setMemorization] = useState(0);
  const [revision, setRevision] = useState(0);
  const [mutun, setMutun] = useState(0);
  const [notes, setNotes] = useState("");

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/students`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHalaqaHistory = async (studentId) => {
    try {
      const res = await axios.get(`${API}/halaqa-grades/${studentId}`);
      setHalaqaHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const openGradeModal = (student) => {
    setSelectedStudent(student);
    setMemorization(0);
    setRevision(0);
    setMutun(0);
    setNotes("");
    fetchHalaqaHistory(student.id);
    setShowGradeModal(true);
  };

  const saveGrade = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      await axios.post(`${API}/halaqa-grades`, {
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        memorization: parseInt(memorization) || 0,
        revision: parseInt(revision) || 0,
        mutun: parseInt(mutun) || 0,
        notes: notes
      });

      showMsg(`✅ تم حفظ درجات ${selectedStudent.name} بنجاح`);
      setShowGradeModal(false);
      fetchStudents(); // Refresh to get updated points
    } catch (err) {
      showMsg("❌ خطأ في حفظ الدرجات");
    }
  };

  const deleteGrade = async (gradeId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الدرجة؟")) return;
    try {
      await axios.delete(`${API}/halaqa-grades/${gradeId}`);
      showMsg("✅ تم حذف الدرجة");
      fetchHalaqaHistory(selectedStudent.id);
      fetchStudents();
    } catch (err) {
      showMsg("❌ خطأ في الحذف");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">📚 لوحة تحكم المعلم</h1>
              <p className="text-emerald-100 text-sm">🎓 تقييم حلقة القرآن</p>
            </div>
            <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold">
              🚪 خروج
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-white border-r-4 border-emerald-500 text-emerald-700 p-3 rounded-lg shadow text-center font-semibold">
            {message}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-emerald-100">
            <p className="text-2xl">👨‍🎓</p>
            <div className="text-2xl font-bold text-emerald-600">{students.length}</div>
            <div className="text-xs text-gray-500">عدد الطلاب</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-lg border border-teal-100">
            <p className="text-2xl">🏆</p>
            <div className="text-2xl font-bold text-teal-600">
              {students.length > 0 ? students.sort((a, b) => b.points - a.points)[0].name : "-"}
            </div>
            <div className="text-xs text-gray-500">المتصدر</div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4">
            <h2 className="text-lg font-bold">📋 قائمة الطلاب</h2>
            <p className="text-emerald-100 text-xs">اختر طالباً لإدخال درجات الحلقة</p>
          </div>
          <div className="p-4 space-y-3">
            {students.sort((a, b) => b.points - a.points).map((student, index) => (
              <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  {student.image_url ? (
                    <img src={student.image_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-lg">
                      {student.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.supervisor || "بدون مجموعة"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                      {student.points} ⭐
                    </span>
                    <p className="text-xs text-gray-400 mt-1">النقاط</p>
                  </div>
                  <button
                    onClick={() => openGradeModal(student)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    📝 تقييم
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade Modal */}
      {showGradeModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowGradeModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              {selectedStudent.image_url ? (
                <img src={selectedStudent.image_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-emerald-300" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                  {selectedStudent.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                <p className="text-sm text-gray-500">إدخال درجات الحلقة</p>
              </div>
            </div>

            <form onSubmit={saveGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">📖 الحفظ (Memorization)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={memorization}
                  onChange={e => setMemorization(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="أدخل الدرجة"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">🔄 المراجعة (Revision)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={revision}
                  onChange={e => setRevision(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="أدخل الدرجة"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">📚 المتون (Texts)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={mutun}
                  onChange={e => setMutun(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="أدخل الدرجة"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">📝 ملاحظات</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="أي ملاحظات على الطالب..."
                  rows="2"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-sm text-emerald-800 text-center">
                  📊 مجموع النقاط: <span className="font-bold">{(parseInt(memorization) || 0) + (parseInt(revision) || 0) + (parseInt(mutun) || 0)}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold">
                  💾 حفظ الدرجات
                </button>
                <button type="button" onClick={() => setShowGradeModal(false)} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">
                  إلغاء
                </button>
              </div>
            </form>

            {/* Previous Grades */}
            {halaqaHistory.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-bold text-gray-700 mb-3">📜 سجل الدرجات السابقة</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {halaqaHistory.map((grade) => (
                    <div key={grade.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">حفظ: {grade.memorization} | مراجعة: {grade.revision} | متون: {grade.mutun}</p>
                          <p className="text-xs text-gray-500">المجموع: {grade.total_points} نقطة</p>
                          {grade.notes && <p className="text-xs text-gray-600 mt-1">📝 {grade.notes}</p>}
                        </div>
                        <button onClick={() => deleteGrade(grade.id)} className="text-red-400 hover:text-red-600 text-xs">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

export default TeacherDashboard;
