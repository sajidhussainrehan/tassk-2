import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function PointsHistoryStudent({ studentId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API}/points-log/${studentId}`);
        setLogs(res.data || []);
      } catch (err) {
        console.error("Error fetching points log:", err);
      } finally {
        setLoading(false);
      }
    };
    if (studentId) fetchLogs();
  }, [studentId]);

  if (loading) return null;

  return (
    <div className="space-y-8" id="history">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-2">Transaction History</h3>
            <p className="text-2xl font-black text-gray-800">كشف الحساب 📄</p>
        </div>
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-rose-100">📄</div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100/50">السبب / العملية</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100/50">النقاط</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100/50">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-6">
                        <p className="text-sm font-black text-gray-800 group-hover:text-[#006d44] transition-colors">{log.reason}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">Automated System Entry</p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-lg font-black italic ${log.points >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                          {log.points >= 0 ? `+${log.points}` : log.points}
                        </span>
                        <span className="text-[8px] font-black text-gray-400 uppercase">Pts</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col items-end">
                        <p className="text-xs font-black text-gray-600">
                          {log.created_at ? new Date(log.created_at).toLocaleDateString('ar-SA') : '-'}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-400 font-bold italic">لا يوجد سجل عمليات لهذا الطالب</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Summary Mini Card */}
      {logs.length > 0 && (
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] rounded-[2rem] p-6 text-white border border-white/5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-xl border border-emerald-500/30">📊</div>
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Balance</p>
                    <p className="text-lg font-black italic">Recent Activity Logged</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-2xl font-black text-emerald-400 italic">Verified</p>
                <p className="text-[8px] font-black text-gray-600 uppercase">Status</p>
            </div>
        </div>
      )}
    </div>
  );
}

export default PointsHistoryStudent;
