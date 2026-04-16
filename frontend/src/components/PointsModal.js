import { useState } from "react";

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

function PointsModal({ student, onClose, onUpdatePoints, loading }) {
  const [activeTab, setActiveTab] = useState("positive");
  const [customMode, setCustomMode] = useState(false);
  const [customPoints, setCustomPoints] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handlePointClick = (points, reason) => {
    onUpdatePoints(student.id, points, reason);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customPoints || !customReason.trim()) return;
    onUpdatePoints(student.id, parseInt(customPoints), customReason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
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
              data-testid="close-points-modal"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => { setActiveTab("positive"); setCustomMode(false); }}
            className={`flex-1 py-3 px-4 font-bold transition-colors ${
              activeTab === "positive" && !customMode
                ? "bg-green-50 text-green-700 border-b-2 border-green-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            data-testid="positive-tab"
          >
            ⊕ نقاط إيجابية
          </button>
          <button
            onClick={() => { setActiveTab("negative"); setCustomMode(false); }}
            className={`flex-1 py-3 px-4 font-bold transition-colors ${
              activeTab === "negative" && !customMode
                ? "bg-red-50 text-red-700 border-b-2 border-red-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            data-testid="negative-tab"
          >
            ⊖ خصم نقاط
          </button>
          <button
            onClick={() => setCustomMode(true)}
            className={`flex-1 py-3 px-4 font-bold transition-colors ${
              customMode
                ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            data-testid="custom-tab"
          >
            ✏️ مخصص
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {!customMode ? (
            <div className="space-y-3">
              {(activeTab === "positive" ? POSITIVE_POINTS : NEGATIVE_POINTS).map((option) => (
                <button
                  key={option.id}
                  onClick={() => handlePointClick(option.points, option.label)}
                  disabled={loading}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    activeTab === "positive"
                      ? "border-green-200 hover:border-green-500 hover:bg-green-50"
                      : "border-red-200 hover:border-red-500 hover:bg-red-50"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  data-testid={`point-option-${option.id}`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="flex-1 font-semibold text-gray-800 text-right">
                    {option.label}
                  </span>
                  <span
                    className={`px-4 py-2 rounded-full font-bold ${
                      option.points > 0
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {option.points > 0 ? "+" : ""}{option.points}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  عدد النقاط *
                </label>
                <input
                  type="number"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="أدخل عدد النقاط (موجب أو سالب)"
                  required
                  data-testid="custom-points-input"
                />
                <p className="text-sm text-gray-500 mt-1">مثال: 50 للإضافة أو -25 للخصم</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  السبب *
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="مثال: فوز في مسابقة"
                  required
                  data-testid="custom-reason-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !customPoints || !customReason.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                data-testid="custom-submit-btn"
              >
                {loading ? "جاري التطبيق..." : "تطبيق النقاط"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default PointsModal;
