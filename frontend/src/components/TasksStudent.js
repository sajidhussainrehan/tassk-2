import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function TasksStudent({ studentId, studentName, studentGroup }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchTasks = async () => {
    try {
      // Build query: if studentGroup exists, fetch tasks assigned to that group
      const url = studentGroup ? `${API}/tasks?group=${encodeURIComponent(studentGroup)}` : `${API}/tasks`;
      const res = await axios.get(url);
      // Filter for tasks that are "available" (not completed)
      setTasks(res.data.filter(t => t.status !== "completed"));
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [studentGroup]);

  const claimTask = async (taskId) => {
    try {
      await axios.post(`${API}/tasks/${taskId}/claim/${studentId}`);
      setMessage("✅ تمت العملية بنجاح! بانتظار موافقة المشرف");
      await fetchTasks();
    } catch (err) {
      setMessage("❌ حدث خطأ أو المهمة محجوزة مسبقاً");
    }
  };

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (loading) return null;
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-black text-gray-400 mb-6 uppercase tracking-[0.3em] mr-2">المبادرات الأسبوعية 🚩</h3>
      
      {message && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl text-center font-bold border-2 border-emerald-100 animate-fadeIn mb-4">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {tasks.map((task) => {
          const isClaimedByMe = task.claimed_by === studentId;
          const isClaimedByOther = task.claimed_by && !isClaimedByMe;
          
          return (
            <div 
              key={task.id} 
              className={`bg-white rounded-[2.5rem] p-8 shadow-2xl border-2 transition-all group relative overflow-hidden ${
                isClaimedByMe ? "border-emerald-500 bg-emerald-50/30" : "border-gray-50 hover:border-[#006d44]/20"
              }`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#006d44]/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-[#006d44]/10 transition-all"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚩</span>
                    <span className={`text-[11px] font-black px-4 py-1.5 rounded-full border uppercase tracking-widest ${
                      isClaimedByMe 
                        ? "bg-emerald-500 text-white border-transparent" 
                        : isClaimedByOther 
                          ? "bg-gray-100 text-gray-400 border-gray-200" 
                          : "bg-[#006d44]/10 text-[#006d44] border-[#006d44]/20"
                    }`}>
                      {isClaimedByMe ? "مبادرتك الحالية" : isClaimedByOther ? "قيد التنفيذ" : "مبادرة متاحة"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-3xl font-black text-[#006d44] italic">+{task.points}</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Points Reward</span>
                  </div>
                </div>

                <p className="text-xl font-black text-gray-800 mb-8 leading-tight">{task.description}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-lg shadow-sm">🚩</div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-0.5">Assigned to</p>
                        <p className="text-xs font-black text-gray-600">{task.group || "All Teams"}</p>
                    </div>
                  </div>
                  
                  {isClaimedByOther ? (
                    <div className="text-[10px] font-black text-gray-400 italic bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                      بواسطة {task.claimed_by_name}
                    </div>
                  ) : (
                    <button
                      onClick={() => claimTask(task.id)}
                      disabled={isClaimedByMe}
                      className={`px-10 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-xl ${
                        isClaimedByMe
                          ? "bg-gray-100 text-gray-400 cursor-default"
                          : "bg-[#006d44] text-white hover:bg-[#014029] hover:shadow-emerald-200 hover:scale-105 active:scale-95"
                      }`}
                    >
                      {isClaimedByMe ? "بانتظار الموافقة" : "إنجاز المبادرة 👋"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TasksStudent;
