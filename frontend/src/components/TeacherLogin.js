import { useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function TeacherLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/auth/teacher-login`, { password });
      localStorage.setItem("teacher_token", res.data.token);
      onLogin(res.data.token);
    } catch (err) {
      setError("❌ كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">معلم حلقة القرآن</h1>
          <p className="text-gray-500 mt-2">Teacher Access</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-emerald-500 text-center"
              placeholder="أدخل كلمة المرور"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
          >
            {loading ? "⏳ جاري الدخول..." : "🔓 دخول"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
          <p className="text-emerald-100 text-sm">👨‍🏫 وصول معلم حلقة لإدخال الدرجات</p>
        </div>
      </div>

      {/* Made with Aboughaith Badge */}
      <div className="fixed bottom-4 left-4 z-50">
        <a href="#" className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span className="text-xs font-medium text-gray-500 group-hover:text-emerald-600">دخول معلم </span>
        </a>
      </div>
    </div>
  );
}

export default TeacherLogin;
