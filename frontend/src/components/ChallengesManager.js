import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ChallengesManager() {
  const headers = {};
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState("");
  const [newChallenge, setNewChallenge] = useState({
    question: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    points: 10,
    start_time: "",
    end_time: ""
  });

  const fetchChallenges = async () => {
    try {
      const response = await axios.get(`${API}/challenges`);
      setChallenges(response.data);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const addChallenge = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/challenges`, newChallenge, { headers });
      setNewChallenge({
        question: "",
        options: ["", "", "", ""],
        correct_answer: 0,
        points: 10,
        start_time: "",
        end_time: ""
      });
      setShowAddModal(false);
      showMessage("تمت إضافة المنافسة بنجاح!");
      await fetchChallenges();
    } catch (error) {
      console.error("Error adding challenge:", error);
      showMessage("حدث خطأ في إضافة المنافسة");
    } finally {
      setLoading(false);
    }
  };

  const toggleChallenge = async (challengeId) => {
    try {
      await axios.put(`${API}/challenges/${challengeId}/toggle`, {}, { headers });
      showMessage("تم تحديث حالة المنافسة");
      await fetchChallenges();
    } catch (error) {
      console.error("Error toggling challenge:", error);
    }
  };

  const deleteChallenge = async (challengeId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المنافسة؟")) return;
    
    try {
      await axios.delete(`${API}/challenges/${challengeId}`, { headers });
      showMessage("تم حذف المنافسة بنجاح");
      await fetchChallenges();
    } catch (error) {
      console.error("Error deleting challenge:", error);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              to="/"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all"
            >
              ← العودة للرئيسية
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <span>إدارة المنافسات</span>
              <span className="text-4xl">🎯</span>
            </h1>
          </div>
          <p className="text-center text-purple-100 text-base">أسئلة تفاعلية مع نقاط مكافأة</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Message Alert */}
        {message && (
          <div className="mb-6 bg-white border-r-4 border-green-500 text-green-700 p-4 rounded-lg shadow-md animate-fadeIn">
            <p className="font-semibold text-center">{message}</p>
          </div>
        )}

        {/* Add Challenge Button */}
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            ➕ إضافة منافسة جديدة
          </button>
        </div>

        {/* Challenges List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-t-4 ${
                challenge.active ? "border-green-500" : "border-gray-400"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{challenge.question}</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">
                      {challenge.points} نقطة
                    </div>
                    {challenge.start_time && (
                      <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] border border-blue-200">
                        📅 يبدأ: {new Date(challenge.start_time).toLocaleString('ar-EG')}
                      </div>
                    )}
                    {challenge.end_time && (
                      <div className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] border border-red-200">
                        ⌛ ينتهي: {new Date(challenge.end_time).toLocaleString('ar-EG')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleChallenge(challenge.id)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      challenge.active
                        ? "bg-green-500 text-white"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    {challenge.active ? "فعّالة" : "متوقفة"}
                  </button>
                  <button
                    onClick={() => deleteChallenge(challenge.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {challenge.options.map((option, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      index === challenge.correct_answer
                        ? "bg-green-100 border-2 border-green-500"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="font-semibold">{index + 1}.</span> {option}
                    {index === challenge.correct_answer && (
                      <span className="mr-2 text-green-600">✓ الإجابة الصحيحة</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {challenges.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-xl text-gray-600">لا توجد منافسات بعد. أضف أول منافسة!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Challenge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">➕ إضافة منافسة جديدة</h3>
            <form onSubmit={addChallenge}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">السؤال *</label>
                  <textarea
                    value={newChallenge.question}
                    onChange={(e) => setNewChallenge({ ...newChallenge, question: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="اكتب السؤال هنا"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الخيارات *</label>
                  {newChallenge.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={newChallenge.correct_answer === index}
                        onChange={() => setNewChallenge({ ...newChallenge, correct_answer: index })}
                        className="w-5 h-5"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newChallenge.options];
                          newOptions[index] = e.target.value;
                          setNewChallenge({ ...newChallenge, options: newOptions });
                        }}
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder={`الخيار ${index + 1}`}
                        required
                      />
                    </div>
                  ))}
                  <p className="text-sm text-gray-500 mt-2">اختر الإجابة الصحيحة بالضغط على الدائرة</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">النقاط المستحقة *</label>
                  <input
                    type="number"
                    value={newChallenge.points}
                    onChange={(e) => setNewChallenge({ ...newChallenge, points: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    placeholder="عدد النقاط"
                    min="1"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">وقت البدء (اختياري)</label>
                    <input
                      type="datetime-local"
                      value={newChallenge.start_time}
                      onChange={(e) => setNewChallenge({ ...newChallenge, start_time: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">وقت الانتهاء (اختياري)</label>
                    <input
                      type="datetime-local"
                      value={newChallenge.end_time}
                      onChange={(e) => setNewChallenge({ ...newChallenge, end_time: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                >
                  {loading ? "جاري الإضافة..." : "إضافة"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-all"
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

export default ChallengesManager;
