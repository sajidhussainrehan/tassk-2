import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

// Point options configuration
const POSITIVE_POINTS = [
  { id: "attendance", label: "حضور", points: 10, emoji: "✅" },
  { id: "project", label: "مشروع طالب", points: 20, emoji: "🎨" },
  { id: "speech", label: "إلقاء كلمة", points: 20, emoji: "🎤" },
  { id: "positive", label: "أفعال إيجابية أخرى", points: 10, emoji: "⭐" },
];

const NEGATIVE_POINTS = [
  { id: "delay", label: "تأخير", points: -5, emoji: "⏰" },
  { id: "absence", label: "غياب", points: -40, emoji: "❌" },
  { id: "language", label: "التلفظ", points: -40, emoji: "🤬" },
  { id: "notebook", label: "عدم إحضار الدفتر", points: -15, emoji: "📕" },
  { id: "negative", label: "أفعال سلبية أخرى", points: -10, emoji: "⚠️" },
];

function PointsModal({ student, onClose, onUpdatePoints, loading: parentLoading }) {
  const [activeTab, setActiveTab] = useState("positive");
  const [customPoints, setCustomPoints] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Halaqa states
  const [memorization, setMemorization] = useState(0);
  const [revision, setRevision] = useState(0);
  const [mutun, setMutun] = useState(0);
  const [notes, setNotes] = useState("");
  const [halaqaHistory, setHalaqaHistory] = useState([]);

  const fetchHalaqaHistory = async () => {
    try {
      const res = await axios.get(`${API}/halaqa-grades/${student.id}`);
      setHalaqaHistory(res.data);
    } catch (err) {
      console.error("Error fetching halaqa history:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "halaqa") {
      fetchHalaqaHistory();
    }
  }, [activeTab]);

  const handlePointClick = (points, reason) => {
    onUpdatePoints(student.id, points, reason);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customPoints || !customReason.trim()) return;
    onUpdatePoints(student.id, parseInt(customPoints), customReason);
  };

  const handleHalaqaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/halaqa-grades`, {
        student_id: student.id,
        student_name: student.name,
        memorization: parseInt(memorization) || 0,
        revision: parseInt(revision) || 0,
        mutun: parseInt(mutun) || 0,
        notes: notes
      });
      
      // Update local points UI
      const total = (parseInt(memorization) || 0) + (parseInt(revision) || 0) + (parseInt(mutun) || 0);
      onUpdatePoints(student.id, total, "درجات الحلقة");
      
      setMemorization(0);
      setRevision(0);
      setMutun(0);
      setNotes("");
      fetchHalaqaHistory();
      setActiveTab("positive");
    } catch (err) {
      console.error("Error saving grade:", err);
      alert("خطأ في حفظ الدرجات");
    } finally {
      setLoading(false);
    }
  };

  const deleteGrade = async (gradeId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الدرجة؟")) return;
    try {
      await axios.delete(`${API}/halaqa-grades/${gradeId}`);
      fetchHalaqaHistory();
    } catch (err) {
      console.error("Error deleting grade:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6">
          <div className="flex items-center gap-4">
            {student.image_url ? (
              <img
                src={student.image_url}
                alt={student.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-white/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                {student.name.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{student.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  {student.points} نقطة
                </span>
                {student.supervisor && (
                  <span className="text-white/80 text-sm">
                    المشرف: {student.supervisor}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab("positive")}
            className={`flex-1 py-3 px-4 font-bold transition-colors whitespace-nowrap ${
              activeTab === "positive"
                ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            ⊕ إيجابية
          </button>
          <button
            onClick={() => setActiveTab("negative")}
            className={`flex-1 py-3 px-4 font-bold transition-colors whitespace-nowrap ${
              activeTab === "negative"
                ? "bg-red-50 text-red-700 border-b-2 border-red-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            ⊖ خصم
          </button>
          <button
            onClick={() => setActiveTab("halaqa")}
            className={`flex-1 py-3 px-4 font-bold transition-colors whitespace-nowrap ${
              activeTab === "halaqa"
                ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            📚 الحلقة
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 py-3 px-4 font-bold transition-colors whitespace-nowrap ${
              activeTab === "custom"
                ? "bg-orange-50 text-orange-700 border-b-2 border-orange-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            ✏️ مخصص
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "positive" && (
            <div className="grid grid-cols-1 gap-3">
              {POSITIVE_POINTS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handlePointClick(option.points, option.label)}
                  disabled={parentLoading}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-right disabled:opacity-50"
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="flex-1 font-semibold text-gray-800">{option.label}</span>
                  <span className="bg-emerald-500 text-white px-4 py-2 rounded-full font-bold">+{option.points}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === "negative" && (
            <div className="grid grid-cols-1 gap-3">
              {NEGATIVE_POINTS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handlePointClick(option.points, option.label)}
                  disabled={parentLoading}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-red-100 hover:border-red-500 hover:bg-red-50 transition-all text-right disabled:opacity-50"
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="flex-1 font-semibold text-gray-800">{option.label}</span>
                  <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">{option.points}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === "halaqa" && (
            <div className="space-y-6">
              <form onSubmit={handleHalaqaSubmit} className="space-y-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                <h3 className="font-bold text-purple-800 mb-2">إدخال درجات الحلقة</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">📖 حفظ</label>
                    <input
                      type="number"
                      value={memorization}
                      onChange={e => setMemorization(e.target.value)}
                      className="w-full p-2 border rounded-lg text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">🔄 مراجعة</label>
                    <input
                      type="number"
                      value={revision}
                      onChange={e => setRevision(e.target.value)}
                      className="w-full p-2 border rounded-lg text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">📚 متون</label>
                    <input
                      type="number"
                      value={mutun}
                      onChange={e => setMutun(e.target.value)}
                      className="w-full p-2 border rounded-lg text-center"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">📝 ملاحظات</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="ملاحظات اختيارية..."
                    rows="1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? "جاري الحفظ..." : "حفظ الدرجات"}
                </button>
              </form>

              {halaqaHistory.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    📜 السجل السابق
                  </h4>
                  <div className="space-y-2">
                    {halaqaHistory.map((grade) => (
                      <div key={grade.id} className="bg-gray-50 p-3 rounded-lg text-sm border flex justify-between items-center group">
                        <div>
                          <p className="font-bold">مجموع: {grade.total_points} نقطة</p>
                          <p className="text-[10px] text-gray-500">
                            حفظ: {grade.memorization} | مراجعة: {grade.revision} | متون: {grade.mutun}
                          </p>
                          {grade.notes && <p className="text-[10px] text-emerald-600 italic mt-1">"{grade.notes}"</p>}
                        </div>
                        <button 
                          onClick={() => deleteGrade(grade.id)}
                          className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "custom" && (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  عدد النقاط *
                </label>
                <input
                  type="number"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="أدخل عدد النقاط (موجب أو سالب)"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  السبب *
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  placeholder="مثال: فوز في مسابقة"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={parentLoading || !customPoints || !customReason.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold shadow-md transition-all"
              >
                تطبيق النقاط
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default PointsModal;
