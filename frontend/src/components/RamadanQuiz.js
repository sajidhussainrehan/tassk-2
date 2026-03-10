import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function RamadanQuiz({ studentId, onPointsEarned }) {
  const [question, setQuestion] = useState(null);
  const [status, setStatus] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizStatus, setQuizStatus] = useState(null); // not_started, active, ended, completed

  useEffect(() => {
    fetchQuizData();
  }, [studentId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's question
      const questionRes = await axios.get(`${API}/ramadan-quiz/today`);
      
      if (questionRes.data.status === "not_started") {
        setQuizStatus("not_started");
        setQuestion(questionRes.data);
      } else if (questionRes.data.status === "ended") {
        setQuizStatus("ended");
        setQuestion(questionRes.data);
      } else if (questionRes.data.status === "completed") {
        setQuizStatus("completed");
        setQuestion(questionRes.data);
      } else {
        setQuizStatus("active");
        setQuestion(questionRes.data);
        
        // Fetch student's status
        const statusRes = await axios.get(`${API}/ramadan-quiz/status/${studentId}`);
        setStatus(statusRes.data);
      }
      
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;
    
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API}/ramadan-quiz/answer/${studentId}?answer=${selectedAnswer}`
      );
      setResult(response.data);
      
      if (response.data.correct && onPointsEarned) {
        onPointsEarned(response.data.points_earned);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        setResult({ already_answered: true, message: error.response.data.detail });
      } else {
        console.error("Error submitting answer:", error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white text-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-2">جاري تحميل المسابقة...</p>
      </div>
    );
  }

  // المسابقة لم تبدأ بعد
  if (quizStatus === "not_started") {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white text-center" dir="rtl">
        <span className="text-5xl block mb-4">🌙</span>
        <h3 className="text-xl font-bold mb-2">مسابقة رمضان</h3>
        <p className="text-blue-100">ستبدا المسابقة في اول يوم من رمضان</p>
        <p className="text-blue-200 text-sm mt-2">ترقبوا 15 سؤال مع جوائز نقاط</p>
      </div>
    );
  }

  // المسابقة انتهت
  if (quizStatus === "ended" || quizStatus === "completed") {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center" dir="rtl">
        <span className="text-5xl block mb-4">🎉</span>
        <h3 className="text-xl font-bold mb-2">مسابقة رمضان</h3>
        <p className="text-green-100">{question?.message || "شكرا لمشاركتك في المسابقة"}</p>
      </div>
    );
  }

  if (!question) return null;

  // Already answered today
  if (status?.already_answered && !result) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white" dir="rtl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">🌙</span>
          <div>
            <h3 className="text-xl font-bold">مسابقة رمضان</h3>
            <p className="text-green-100 text-sm">اليوم {question.day} من رمضان</p>
          </div>
        </div>
        
        <div className="bg-white/20 rounded-xl p-4 text-center">
          <span className="text-5xl block mb-3">✅</span>
          <p className="text-lg font-semibold">لقد اجبت على سؤال اليوم</p>
          <p className="text-green-100 text-sm mt-2">عد غدا للسؤال الجديد ان شاء الله</p>
          <div className="mt-3 bg-white/20 rounded-lg px-4 py-2 inline-block">
            <span className="text-sm">اجبت على {status.total_answered} من 15 سؤال</span>
          </div>
        </div>
      </div>
    );
  }

  // Show result after answering
  if (result) {
    return (
      <div className={`rounded-2xl p-6 text-white ${result.correct ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`} dir="rtl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">🌙</span>
          <div>
            <h3 className="text-xl font-bold">مسابقة رمضان</h3>
            <p className="text-sm opacity-80">اليوم {question.day} من رمضان</p>
          </div>
        </div>
        
        <div className="bg-white/20 rounded-xl p-6 text-center">
          <span className="text-6xl block mb-4">{result.correct ? '🎉' : '😔'}</span>
          <p className="text-2xl font-bold mb-2">{result.correct ? 'احسنت اجابة صحيحة' : 'اجابة خاطئة حاول غدا'}</p>
          
          {result.correct && (
            <div className="bg-white/20 rounded-lg px-6 py-3 inline-block mt-2">
              <span className="text-lg">+{result.points_earned} نقطة</span>
            </div>
          )}
          
          {!result.correct && (
            <div className="mt-4 bg-white/20 rounded-lg p-3">
              <p className="text-sm mb-1">الاجابة الصحيحة:</p>
              <p className="font-bold">{question.options[result.correct_answer]}</p>
            </div>
          )}
          
          <p className="text-sm opacity-80 mt-4">عد غدا للسؤال الجديد</p>
        </div>
      </div>
    );
  }

  // Show question
  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl overflow-hidden shadow-xl" dir="rtl">
      {/* Header */}
      <div className="bg-black/20 px-6 py-4 flex items-center gap-3">
        <span className="text-4xl">🌙</span>
        <div>
          <h3 className="text-xl font-bold text-white">مسابقة رمضان</h3>
          <p className="text-purple-200 text-sm">اليوم {question.day} من 15 • {question.points} نقطة</p>
        </div>
      </div>
      
      {/* Question */}
      <div className="p-6">
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <p className="text-white text-lg font-semibold leading-relaxed">{question.question}</p>
        </div>
        
        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => setSelectedAnswer(index)}
              disabled={submitting}
              className={`w-full p-4 rounded-xl text-right transition-all ${
                selectedAnswer === index
                  ? 'bg-white text-purple-700 shadow-lg transform scale-[1.02]'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  selectedAnswer === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/30 text-white'
                }`}>
                  {['أ', 'ب', 'ج', 'د'][index]}
                </div>
                <span className="font-medium">{option}</span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null || submitting}
          className="w-full mt-6 bg-white text-purple-700 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-purple-700 border-t-transparent rounded-full"></div>
              جاري التحقق...
            </span>
          ) : (
            'إرسال الإجابة'
          )}
        </button>
      </div>
    </div>
  );
}

export default RamadanQuiz;
