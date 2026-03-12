import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function TasksManager({ supervisors }) {
  const [tasks, setTasks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [group, setGroup] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all");

  const headers = {};

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/tasks`, { group, description, points }, { headers });
      setShowAdd(false);
      setDescription(""); setPoints(10);
      setMessage("تمت إضافة المهمة");
      await fetchTasks();
    } catch (err) {
      setMessage("خطأ في إضافة المهمة");
    } finally { setLoading(false); }
  };

  const completeTask = async (taskId) => {
    try {
      await axios.post(`${API}/tasks/${taskId}/complete`, {}, { headers });
      setMessage("تم اكتمال المهمة وإضافة النقاط");
      await fetchTasks();
    } catch (err) {
      setMessage(err.response?.data?.detail || "خطأ");
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("حذف هذه المهمة؟")) return;
    try {
      await axios.delete(`${API}/tasks/${taskId}`, { headers });
      await fetchTasks();
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 3000); return () => clearTimeout(t); } }, [message]);

  const filteredTasks = filter === "all" ? tasks : tasks.filter(t => t.group === filter);

  const getStatusBadge = (task) => {
    if (task.status === "completed") return <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">✅ مكتملة</span>;
    if (task.status === "awaiting_approval") return <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">⏳ بانتظار الموافقة</span>;
    if (task.claimed_by) return <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">🔒 محجوزة</span>;
    return <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">📌 متاحة</span>;
  };

  const getDaysLeft = (expiresAt) => {
    const now = new Date();
    const exp = new Date(expiresAt);
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-4">
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center font-semibold">{message}</div>}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded-full text-sm font-semibold ${filter === "all" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}>الكل</button>
          {supervisors.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-full text-sm font-semibold ${filter === s ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}>{s}</button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold" data-testid="add-task-btn">📌 مهمة جديدة</button>
      </div>

      <div className="space-y-3">
        {filteredTasks.map(task => (
          <div key={task.id} className={`bg-white rounded-xl shadow p-4 border-r-4 ${
            task.status === "completed" ? "border-green-500 opacity-75" : 
            task.status === "awaiting_approval" ? "border-orange-500" : 
            task.claimed_by ? "border-yellow-500" : "border-blue-500"
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(task)}
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{task.group}</span>
                  <span className="text-xs text-gray-400">متبقي {getDaysLeft(task.expires_at)} يوم</span>
                </div>
                <p className="font-semibold text-gray-800">{task.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm font-bold">💎 {task.points} نقطة</span>
                  {task.claimed_by_name && <span className="text-sm text-gray-600">👤 حجزها: {task.claimed_by_name}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                {task.status === "awaiting_approval" && (
                  <button onClick={() => completeTask(task.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold" data-testid={`complete-task-${task.id}`}>
                    ✅ اعتماد
                  </button>
                )}
                <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 text-lg">&#10005;</button>
              </div>
            </div>
          </div>
        ))}
        {filteredTasks.length === 0 && <div className="text-center py-8 text-gray-500">لا توجد مهام</div>}
      </div>

      {/* Add Task Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">إضافة مهمة جديدة</h3>
            <form onSubmit={addTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">المجموعة</label>
                <select value={group} onChange={e => setGroup(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" required data-testid="task-group">
                  <option value="">اختر المجموعة</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">وصف المهمة</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" placeholder="اكتب المهمة هنا" rows="3" required data-testid="task-description" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">النقاط</label>
                <input type="number" min="1" value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" required data-testid="task-points" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-task">
                  {loading ? "جاري الحفظ..." : "إضافة المهمة"}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksManager;
