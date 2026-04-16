import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function QuduratStudent({ studentId, studentName, onUpdate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState(null);
  const [submissions, setSubmissions] = useState({}); // item_id -> submission object

  const [formData, setFormData] = useState({
    answer: null,
    summary: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/qudurat/active`);
      const activeItems = res.data;
      setItems(activeItems);

      // Check submission status for each item
      const subs = {};
      await Promise.all(activeItems.map(async (item) => {
        const subRes = await axios.get(`${API}/qudurat/${item.id}/submission/${studentId}`);
        if (subRes.data.submitted) {
          subs[item.id] = subRes.data.submission;
        }
      }));
      setSubmissions(subs);
    } catch (error) {
      console.error("Error fetching Qudurat items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const handleSubmit = async (itemId) => {
    if (formData.answer === null || !formData.summary.trim()) {
      setMessage("يرجى الإجابة على السؤال وكتابة التلخيص أولاً");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/qudurat/${itemId}/submit`, {
        student_id: studentId,
        student_name: studentName,
        answer: formData.answer,
        summary: formData.summary
      });
      
      setMessage(res.data.is_correct ? `إجابة صحيحة! +${res.data.points_earned} نقطة. التلخيص بانتظار المراجعة.` : "إجابة خاطئة، تم إرسال التلخيص للمراجعة.");
      
      setFormData({ answer: null, summary: "" });
      setExpandedItem(null);
      await fetchData();
      if (onUpdate) onUpdate();
    } catch (error) {
      setMessage(error.response?.data?.detail || "خطأ في الإرسال");
    } finally {
      setSubmitting(false);
    }
  };

  const getYTId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return <div className="p-4 text-center">جاري تحميل دروس القدرات...</div>;
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3">
        <h3 className="font-bold text-center text-sm">🍿 دروس القدرات الذكية (فيديو)</h3>
      </div>
      <div className="p-4 space-y-4">
        {message && (
          <div className="bg-green-50 border-r-4 border-green-500 p-3 rounded text-sm text-green-700 font-bold mb-4 animate-fadeIn">
            {message}
          </div>
        )}

        {items.map((item) => {
          const submission = submissions[item.id];
          const isExpanded = expandedItem === item.id;

          return (
            <div key={item.id} className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? "border-green-500 shadow-lg" : "border-gray-100"}`}>
              {/* Card Header/Preview */}
              <div 
                className={`p-4 cursor-pointer flex items-center justify-between ${isExpanded ? "bg-green-50" : "bg-white hover:bg-gray-50"}`}
                onClick={() => !submission && setExpandedItem(isExpanded ? null : item.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                    {submission ? "✅" : "🎬"}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{item.question}</h4>
                    {submission ? (
                      <p className="text-xs text-green-600 font-bold">
                        {submission.status === "pending" ? "⏳ التلخيص بانتظار المراجعة" : 
                         submission.status === "approved" ? `✨ تم التقييم: +${submission.points_summary_awarded} نقطة` : "❌ لم يتم قبول التلخيص"}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">اضغط للمشاهدة والحل - <span className="text-green-600 font-bold">💎 {item.points_question + item.points_summary} نقطة محتملة</span></p>
                    )}
                  </div>
                </div>
                {!submission && (
                  <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
                    🔽
                  </div>
                )}
              </div>

              {/* Card Body (Expanded) */}
              {isExpanded && !submission && (
                <div className="p-4 space-y-4 bg-white border-t-2 border-dashed border-gray-200">
                  {/* YouTube Embed */}
                  <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-inner border shadow-lg border-gray-300">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYTId(item.video_url)}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>

                  {/* Question */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <p className="font-bold text-gray-800">السؤال: {item.question}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setFormData({ ...formData, answer: idx })}
                          className={`p-3 rounded-xl border-2 text-right transition-all font-bold text-sm ${
                            formData.answer === idx 
                            ? "border-green-500 bg-green-100 shadow-md" 
                            : "border-gray-100 bg-gray-50 hover:bg-white"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-800">لخّص الفكرة الرئيسية للفيديو باختصار:</label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none min-h-[100px] text-sm"
                      placeholder="اكتب تلخيصك هنا للمراجعة من قبل المشرف..."
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={() => handleSubmit(item.id)}
                    disabled={submitting || formData.answer === null || !formData.summary.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold disabled:opacity-50 transition-all active:translate-y-1"
                  >
                    {submitting ? "جاري الإرسال..." : "إرسال الإجابة والتلخيص 🚀"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuduratStudent;
