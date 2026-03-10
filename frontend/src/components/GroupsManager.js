import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GROUP_COLORS = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-red-500 to-red-600",
  "from-indigo-500 to-indigo-600",
];

function GroupsManager({ onGroupsChange }) {
  const [groups, setGroups] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API}/groups`);
      setGroups(res.data);
      if (onGroupsChange) onGroupsChange(res.data.map(g => g.name));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchGroups(); }, []);

  const addGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/groups`, { name });
      setShowAdd(false);
      setName("");
      setMessage("✅ تمت إضافة المجموعة");
      await fetchGroups();
    } catch (err) {
      setMessage(err.response?.data?.detail || "خطأ في الإضافة");
    } finally { setLoading(false); }
  };

  const updateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/groups/${editGroup.id}`, { name });
      setEditGroup(null);
      setName("");
      setMessage("✅ تم تحديث المجموعة");
      await fetchGroups();
    } catch (err) {
      setMessage(err.response?.data?.detail || "خطأ في التحديث");
    } finally { setLoading(false); }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm("حذف هذه المجموعة؟ سيتم إلغاء ربط الطلاب بها")) return;
    try {
      await axios.delete(`${API}/groups/${id}`);
      setMessage("✅ تم حذف المجموعة");
      await fetchGroups();
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 3000); return () => clearTimeout(t); } }, [message]);

  return (
    <div className="space-y-4">
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center font-semibold">{message}</div>}

      <button onClick={() => { setShowAdd(true); setName(""); }} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm" data-testid="add-group-btn">
        ➕ إضافة مجموعة جديدة
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group, i) => (
          <div key={group.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className={`bg-gradient-to-r ${GROUP_COLORS[i % GROUP_COLORS.length]} text-white p-4`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">🏅 {group.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setEditGroup(group); setName(group.name); }}
                    className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs font-semibold" data-testid={`edit-group-${group.id}`}>✏️</button>
                  <button onClick={() => deleteGroup(group.id)}
                    className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs" data-testid={`delete-group-${group.id}`}>🗑️</button>
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{group.student_count}</p>
                  <p className="text-xs text-gray-500">طالب في المجموعة</p>
                </div>
              </div>
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                ⚽ فريق كرة القدم
              </div>
            </div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📁</p>
          <p className="font-semibold">لا توجد مجموعات بعد</p>
          <p className="text-sm">أضف مجموعة جديدة للبدء</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAdd || editGroup) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => { setShowAdd(false); setEditGroup(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">{editGroup ? "✏️ تعديل المجموعة" : "➕ إضافة مجموعة جديدة"}</h3>
            <form onSubmit={editGroup ? updateGroup : addGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">اسم المجموعة</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" placeholder="مثال: فريق النخبة" required data-testid="group-name-input" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-group">
                  {loading ? "جاري الحفظ..." : editGroup ? "تحديث" : "إضافة"}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setEditGroup(null); }} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupsManager;
