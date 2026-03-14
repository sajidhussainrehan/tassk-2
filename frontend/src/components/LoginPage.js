import { useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { username, password });
      localStorage.setItem("ghiras_token", res.data.token);
      onLogin(res.data.token);
    } catch (err) {
      setError(err.response?.data?.detail || "خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl font-bold">
            غ
          </div>
          <h1 className="text-3xl font-bold text-gray-800">نادي غِراس</h1>
          <p className="text-gray-500 mt-2">تسجيل دخول المشرف</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-center" data-testid="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              placeholder="اسم المستخدم"
              required
              data-testid="login-username"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              placeholder="كلمة المرور"
              required
              data-testid="login-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-bold text-lg transition-all disabled:opacity-50"
            data-testid="login-submit"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        {/* Special Access Icons */}
        <div className="mt-6 flex justify-center gap-6">
          {/* View-Only Admin Icon */}
          <a 
            href="/viewonly-login" 
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center shadow-lg transition-all">
              <span className="text-2xl">👁️</span>
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-blue-600">المشاهدة فقط</span>
          </a>

          {/* Teacher Icon */}
          <a 
            href="/teacher-login" 
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-emerald-100 group-hover:bg-emerald-200 rounded-full flex items-center justify-center shadow-lg transition-all">
              <span className="text-2xl">📚</span>
            </div>
            <span className="text-xs font-medium text-gray-500 group-hover:text-emerald-600">دخول معلم خلقة</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
