import { useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function TeacherLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/teacher-login`, { username, password });
      const teacherData = {
        token: res.data.token,
        teacherId: res.data.teacher_id,
        teacherName: res.data.teacher_name
      };
      localStorage.setItem("teacher_token", JSON.stringify(teacherData));
      onLogin(teacherData);
    } catch (err) {
      setError(err.response?.data?.detail || "❌ اسم المستخدم أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-black">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-black">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">بوابة المعلم</h1>
          <p className="text-gray-500 mt-2 font-semibold">نظام غراس لإقرأ وارتق</p>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 text-center font-bold"
              placeholder="اسم المستخدم الخاص بك"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500 text-center"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
          >
            {loading ? "⏳ جاري الدخول..." : "🔓 دخول"}
          </button>
        </form>

        <div className="mt-8 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
          <p className="text-emerald-800 text-sm font-bold text-center">👨‍🏫 بوابة المعلم الرسمية</p>
        </div>
      </div>
    </div>
  );
}

export default TeacherLogin;
