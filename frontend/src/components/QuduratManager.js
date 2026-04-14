import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function QuduratManager() {
  const [items, setItems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState("manage"); // manage or review
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newItem, setNewItem] = useState({
    video_url: "",
    question: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    points_question: 10,
    points_summary: 20
  });

  const [reviewData, setReviewData] = useState({
    submission_id: null,
    points: 0,
    status: "approved"
  });

  const [editReviewData, setEditReviewData] = useState({
    submission_id: null,
    points: 0,
    status: "approved"
  });

  const fetchData = async () => {
    try {
      const [itemsRes, subsRes] = await Promise.all([
        axios.get(`${API}/qudurat`),
        axios.get(`${API}/qudurat/submissions`)
      ]);
      setItems(itemsRes.data);
      setSubmissions(subsRes.data);
    } catch (error) {
      console.error("Error fetching Qudurat data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const addItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/qudurat`, newItem);
      setNewItem({
        video_url: "",
        question: "",
        options: ["", "", "", ""],
        correct_answer: 0,
        points_question: 10,
        points_summary: 20
      });
      setShowAddModal(false);
      showMsg("تمت إضافة الفيديو بنجاح!");
      await fetchData();
    } catch (error) {
      showMsg("خطأ في الإضافة");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      await axios.delete(`${API}/qudurat/${id}`);
      showMsg("تم الحذف");
      await fetchData();
    } catch (error) {
      showMsg("خطأ في الحذف");
    }
  };

  const toggleItem = async (id) => {
    try {
      await axios.put(`${API}/qudurat/${id}/toggle`);
      await fetchData();
    } catch (error) {
      showMsg("خطأ في التحديث");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/qudurat/submissions/${reviewData.submission_id}/review`, {
        points: reviewData.points,
        status: reviewData.status
      });
      showMsg("تم تسجيل التقييم");
      setReviewData({ submission_id: null, points: 0, status: "approved" });
      await fetchData();
    } catch (error) {
      showMsg("خطأ في التقييم");
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التلخيص؟ سيختفي من القائمة نهائياً.")) return;
    try {
      await axios.delete(`${API}/qudurat/submissions/${id}`);
      showMsg("تم حذف التلخيص");
      await fetchData();
    } catch (error) {
      showMsg("خطأ في الحذف");
    }
  };

  const submitEditReview = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/qudurat/submissions/${editReviewData.submission_id}/edit-review`, {
        points: editReviewData.points,
        status: editReviewData.status
      });
      showMsg("✅ تم تعديل التقييم بنجاح");
      setEditReviewData({ submission_id: null, points: 0, status: "approved" });
      await fetchData();
    } catch (error) {
      showMsg("خطأ في تعديل التقييم");
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract YouTube ID
  const getYTId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("manage")}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${
            activeTab === "manage" ? "bg-green-600 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          📹 إدارة الفيديوهات
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`flex-1 py-3 rounded-xl font-bold transition-all relative ${
            activeTab === "review" ? "bg-green-600 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          ✍️ مراجعة التلخيصات
          {submissions.filter(s => s.status === "pending").length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs animate-bounce border-2 border-white">
              {submissions.filter(s => s.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {message && (
        <div className="bg-white border-2 border-green-500 text-green-700 p-3 rounded-lg text-center font-bold">
          {message}
        </div>
      )}

      {activeTab === "manage" ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
              ➕ فيديو جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-lg border border-green-100 overflow-hidden">
                <div className="aspect-video mb-3 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {getYTId(item.video_url) ? (
                    <img 
                      src={`https://img.youtube.com/vi/${getYTId(item.video_url)}/0.jpg`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">رابط غير صحيح</div>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1">{item.question}</h3>
                <div className="flex gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">💎 {item.points_question} نقطة للإجابة</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">💎 {item.points_summary} نقطة للتلخيص</span>
                </div>
                <div className="flex justify-between items-center gap-2 pt-3 border-t">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-bold ${
                      item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.is_active ? "فعال" : "متوقف"}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-sm font-bold border border-red-200 hover:bg-red-100"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500 font-bold">لا توجد تلخيصات بانتظار المراجعة حالياً ✨</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div key={sub.id} className={`bg-white rounded-2xl p-6 shadow-lg border border-green-100 relative overflow-hidden ${sub.status !== "pending" ? "opacity-90" : ""}`}>
                {sub.status !== "pending" && (
                  <div className={`absolute top-0 right-0 left-0 h-1 ${sub.status === "approved" ? "bg-green-500" : "bg-red-500"}`} />
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{sub.student_name}</h3>
                    <p className="text-sm text-gray-500">بتاريخ: {new Date(sub.created_at).toLocaleDateString("ar-SA")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${sub.is_correct ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                      السؤال: {sub.is_correct ? "صحيح" : "خطأ"}
                    </div>
                    {sub.status !== "pending" && (
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold border-2 border-green-200 ${sub.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-50 text-red-800"}`}>
                        تم التقييم: {sub.status === "approved" ? `مقبول (${sub.points_summary_awarded} 💎)` : "مرفوض"}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 italic text-gray-700 whitespace-pre-wrap">
                  {sub.summary}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-dashed">
                  {sub.status === "pending" ? (
                    <form onSubmit={submitReview} className="flex flex-wrap gap-3 items-center w-full">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold mb-1 text-gray-500">النقاط المستحقة (كحد أقصى {items.find(it => it.id === sub.qudurat_id)?.points_summary || 0})</label>
                        <input
                          type="number"
                          value={reviewData.submission_id === sub.id ? reviewData.points : 0}
                          onChange={(e) => setReviewData({ ...reviewData, submission_id: sub.id, points: parseInt(e.target.value) })}
                          onClick={() => setReviewData({ ...reviewData, submission_id: sub.id })}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="أدخل عدد النقاط"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading || reviewData.submission_id !== sub.id}
                          onClick={() => setReviewData({...reviewData, submission_id: sub.id, status: "approved"})}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 text-sm"
                        >
                          قبول
                        </button>
                        <button
                          type="button"
                          disabled={loading || reviewData.submission_id !== sub.id}
                          onClick={() => {
                            setReviewData({...reviewData, submission_id: sub.id, status: "rejected", points: 0});
                            (async () => {
                              setLoading(true);
                              try {
                                await axios.post(`${API}/qudurat/submissions/${sub.id}/review`, { points: 0, status: "rejected" });
                                showMsg("تم الرفض");
                                fetchData();
                              } catch (e) { showMsg("خطأ"); } finally { setLoading(false); }
                            })();
                          }}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 text-sm"
                        >
                          رفض
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3 w-full">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm italic font-medium">✨ هذا التلخيص تمت مراجعته مسبقاً</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditReviewData({ submission_id: sub.id, points: sub.points_summary_awarded || 0, status: sub.status })}
                            className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg border border-blue-200"
                          >
                            ✏️ تعديل الدرجة
                          </button>
                          <button
                            onClick={() => deleteSubmission(sub.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 px-3 py-1 rounded-lg border border-red-200"
                          >
                            🗑️ حذف للأبد
                          </button>
                        </div>
                      </div>
                      {editReviewData.submission_id === sub.id && (
                        <form onSubmit={submitEditReview} className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 space-y-3">
                          <h4 className="font-bold text-blue-700 text-sm">✏️ تعديل تقييم التلخيص</h4>
                          <div>
                            <label className="block text-xs font-bold mb-1 text-gray-500">النقاط الجديدة (كحد أقصى {items.find(it => it.id === sub.qudurat_id)?.points_summary || 0})</label>
                            <input
                              type="number"
                              value={editReviewData.points}
                              onChange={(e) => setEditReviewData({ ...editReviewData, points: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
                              placeholder="أدخل عدد النقاط الجديد"
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={loading}
                              onClick={() => setEditReviewData({...editReviewData, status: "approved"})}
                              className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 text-sm"
                            >
                              ✅ قبول بالدرجة الجديدة
                            </button>
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() => {
                                setEditReviewData({...editReviewData, status: "rejected", points: 0});
                                (async () => {
                                  setLoading(true);
                                  try {
                                    await axios.put(`${API}/qudurat/submissions/${sub.id}/edit-review`, { points: 0, status: "rejected" });
                                    showMsg("تم تعديل التقييم إلى مرفوض");
                                    setEditReviewData({ submission_id: null, points: 0, status: "approved" });
                                    fetchData();
                                  } catch (e) { showMsg("خطأ"); } finally { setLoading(false); }
                                })();
                              }}
                              className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 text-sm"
                            >
                              ❌ رفض
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditReviewData({ submission_id: null, points: 0, status: "approved" })}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm"
                            >
                              إلغاء
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <h2 className="text-2xl font-bold mb-6 text-center">🍿 إضافة درس قدرات جديد</h2>
            <form onSubmit={addItem} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">رابط فيديو اليوتيوب</label>
                <input
                  type="url"
                  value={newItem.video_url}
                  onChange={(e) => setNewItem({ ...newItem, video_url: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-green-500 focus:outline-none"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">السؤال حول الفيديو</label>
                <input
                  type="text"
                  value={newItem.question}
                  onChange={(e) => setNewItem({ ...newItem, question: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:border-green-500 focus:outline-none"
                  placeholder="ما هي الفكرة الأساسية في..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newItem.options.map((opt, idx) => (
                  <div key={idx} className="flex flex-col">
                    <label className="text-xs font-bold mb-1 text-gray-500">الخيار {idx + 1}</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="radio"
                        name="correct"
                        checked={newItem.correct_answer === idx}
                        onChange={() => setNewItem({ ...newItem, correct_answer: idx })}
                        className="w-5 h-5 accent-green-500"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const opts = [...newItem.options];
                          opts[idx] = e.target.value;
                          setNewItem({ ...newItem, options: opts });
                        }}
                        className="flex-1 px-4 py-2 border-2 rounded-xl focus:border-green-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="block text-sm font-bold mb-1">نقاط السؤال</label>
                  <input
                    type="number"
                    value={newItem.points_question}
                    onChange={(e) => setNewItem({ ...newItem, points_question: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">نقاط التلخيص</label>
                  <input
                    type="number"
                    value={newItem.points_summary}
                    onChange={(e) => setNewItem({ ...newItem, points_summary: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 rounded-xl focus:border-green-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold hover:-translate-y-1 transition-transform"
                >
                  {loading ? "جاري الإضافة..." : "اعتماد الدرس"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-black py-4 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuduratManager;
