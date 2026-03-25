import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function TeacherManagement({ onClose }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API}/teachers`);
      setTeachers(res.data);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      showMsg("❌ خطأ في جلب بيانات المعلمين");
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const addTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/teachers`, {
        name: newName,
        username: newUsername,
        password: newPassword
      });
      setNewName("");
      setNewUsername("");
      setNewPassword("");
      setShowAddForm(false);
      showMsg("✅ تم إضافة المعلم بنجاح");
      fetchTeachers();
    } catch (err) {
      showMsg(err.response?.data?.detail || "❌ خطأ في إضافة المعلم");
    } finally {
      setLoading(false);
    }
  };

  const updateTeacher = async (e) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setLoading(true);
    try {
      const updateData = {};
      if (editName) updateData.name = editName;
      if (editUsername) updateData.username = editUsername;
      if (editPassword) updateData.password = editPassword;
      
      await axios.put(`${API}/teachers/${editingTeacher.id}`, updateData);
      setEditingTeacher(null);
      setEditName("");
      setEditUsername("");
      setEditPassword("");
      showMsg("✅ تم تحديث بيانات المعلم");
      fetchTeachers();
    } catch (err) {
      showMsg(err.response?.data?.detail || "❌ خطأ في تحديث بيانات المعلم");
    } finally {
      setLoading(false);
    }
  };

  const deleteTeacher = async (teacherId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المعلم؟")) return;
    try {
      await axios.delete(`${API}/teachers/${teacherId}`);
      showMsg("✅ تم حذف المعلم");
      fetchTeachers();
    } catch (err) {
      showMsg("❌ خطأ في حذف المعلم");
    }
  };

  const startEdit = (teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditUsername(teacher.username);
    setEditPassword("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-lime-500 to-green-600 text-black p-4 rounded-t-2xl border-b-2 border-black">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">👨‍🏫 إدارة المعلمين</h2>
            <button onClick={onClose} className="text-black hover:text-gray-700 text-2xl">
              ×
            </button>
          </div>
          <p className="text-sm mt-1 opacity-80">إضافة وتعديل بيانات المعلمين</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg text-center font-semibold ${
              message.includes("✅") ? "bg-lime-100 text-green-700 border border-green-300" :
              "bg-red-100 text-red-700 border border-red-300"
            }`}>
              {message}
            </div>
          )}

          {/* Add Teacher Button */}
          {!showAddForm && !editingTeacher && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-lime-500 hover:bg-lime-600 text-black py-3 rounded-xl font-bold border-2 border-black transition-all"
            >
              ➕ إضافة معلم جديد
            </button>
          )}

          {/* Add Teacher Form */}
          {showAddForm && (
            <form onSubmit={addTeacher} className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 space-y-4">
              <h3 className="font-bold text-gray-800 mb-3">🆕 إضافة معلم جديد</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-lime-500"
                  placeholder="أدخل اسم المعلم..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-lime-500"
                  placeholder="أدخل اسم المستخدم..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-lime-500"
                  placeholder="أدخل كلمة المرور..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-lime-500 hover:bg-lime-600 text-black py-2 rounded-lg font-bold border-2 border-black disabled:opacity-50"
                >
                  {loading ? "⏳ جاري الحفظ..." : "💾 حفظ"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Edit Teacher Form */}
          {editingTeacher && (
            <form onSubmit={updateTeacher} className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 space-y-4">
              <h3 className="font-bold text-blue-800 mb-3">✏️ تعديل بيانات المعلم</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="أدخل اسم المعلم..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="أدخل اسم المستخدم..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">كلمة المرور (اتركه فارغاً للإبقاء على القديمة)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="أدخل كلمة المرور الجديدة..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-bold border-2 border-black disabled:opacity-50"
                >
                  {loading ? "⏳ جاري التحديث..." : "💾 تحديث"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Teachers List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gray-50 p-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-700">📋 قائمة المعلمين ({teachers.length})</h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {teachers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-4xl mb-2">📭</p>
                  <p>لا يوجد معلمين مسجلين</p>
                </div>
              ) : (
                teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-lime-100 text-green-700 flex items-center justify-center font-bold">
                        👨‍🏫
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{teacher.name}</p>
                        <p className="text-xs text-gray-500">@{teacher.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(teacher)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteTeacher(teacher.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-bold"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherManagement;
