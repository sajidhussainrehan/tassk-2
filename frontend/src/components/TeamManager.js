import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function TeamManager({ groups, students }) {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [teamData, setTeamData] = useState({ name: "", group_photo: "", lineup: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchTeamData = useCallback(async (groupName) => {
    if (!groupName) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/teams/${groupName}`);
      if (res.data) {
        setTeamData(res.data);
      } else {
        setTeamData({ name: groupName, group_photo: "", lineup: [] });
      }
    } catch (err) {
      console.error("Error fetching team:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedGroup) fetchTeamData(selectedGroup);
  }, [selectedGroup, fetchTeamData]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedGroup) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API}/teams/${selectedGroup}/upload-photo`, formData);
      setTeamData(prev => ({ ...prev, group_photo: res.data.image_url }));
      setMessage("تم رفع الصورة بنجاح");
    } catch (err) {
      setMessage("خطأ في رفع الصورة");
    }
  };

  const saveTeam = async () => {
    try {
      await axios.post(`${API}/teams`, teamData);
      setMessage("تم حفظ بيانات الفريق");
    } catch (err) {
      setMessage("خطأ في الحفظ");
    }
  };

  const addToLineup = (student) => {
    if (teamData.lineup.find(p => p.student_id === student.id)) return;
    const newPlayer = {
      student_id: student.id,
      name: student.name,
      x: 50, // center
      y: 80  // bottom
    };
    setTeamData(prev => ({ ...prev, lineup: [...prev.lineup, newPlayer] }));
  };

  const removeFromLineup = (id) => {
    setTeamData(prev => ({ ...prev, lineup: prev.lineup.filter(p => p.student_id !== id) }));
  };

  const updatePosition = (id, x, y) => {
    setTeamData(prev => ({
      ...prev,
      lineup: prev.lineup.map(p => p.student_id === id ? { ...p, x, y } : p)
    }));
  };

  const groupStudents = students.filter(s => s.supervisor === selectedGroup);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-emerald-700">⚽ إدارة فرق الدوري</h2>
        {message && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold animate-pulse">{message}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar: Group Select & Rosters */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اختر المجموعة (الفريق)</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- اختر مجموعة --</option>
              {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {selectedGroup && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h3 className="font-bold text-emerald-800 mb-3 border-b border-emerald-200 pb-2">طلاب المجموعة</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {groupStudents.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                    <span className="text-sm font-semibold">{s.name}</span>
                    <button
                      onClick={() => addToLineup(s)}
                      disabled={teamData.lineup.some(p => p.student_id === s.id)}
                      className="bg-emerald-500 text-white w-6 h-6 rounded-full text-xs font-bold disabled:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedGroup && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">الصورة الجماعية للفريق</label>
              {teamData.group_photo && (
                <img src={teamData.group_photo} alt="Team" className="w-full aspect-video object-cover rounded-xl shadow-md border-2 border-emerald-500 mb-2" />
              )}
              <input type="file" onChange={handlePhotoUpload} className="hidden" id="team-photo-input" accept="image/*" />
              <label htmlFor="team-photo-input" className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl cursor-pointer font-bold border-2 border-dashed border-gray-300 transition-colors">
                {teamData.group_photo ? "تغيير الصورة الجماعية" : "رفع صورة جماعية 📸"}
              </label>
            </div>
          )}
        </div>

        {/* Main: Field View */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">تشكيلة الفريق في الملعب</h3>
            <button
               onClick={saveTeam}
               className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg"
            >
               حفظ التشكيلة 💾
            </button>
          </div>

          <div className="relative aspect-[4/5] bg-emerald-700 rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
            {/* Field Markings */}
            <div className="absolute inset-4 border-2 border-white/40 pointer-events-none"></div>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/40 rounded-full"></div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/40"></div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-24 border-2 border-white/40"></div>

            {!selectedGroup ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm text-white font-bold p-8 text-center">
                الرجاء اختيار مجموعة للبدء في تنظيم التشكيلة
              </div>
            ) : (
              <div className="absolute inset-0">
                {teamData.lineup.map(player => (
                  <div
                    key={player.student_id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move group h-12 w-12"
                    style={{ left: `${player.x}%`, top: `${player.y}%` }}
                    onMouseDown={(e) => {
                      const rect = e.currentTarget.parentElement.getBoundingClientRect();
                      const handleMouseMove = (mmE) => {
                        const x = Math.min(100, Math.max(0, ((mmE.clientX - rect.left) / rect.width) * 100));
                        const y = Math.min(100, Math.max(0, ((mmE.clientY - rect.top) / rect.height) * 100));
                        updatePosition(player.student_id, x, y);
                      };
                      const handleMouseUp = () => {
                        window.removeEventListener("mousemove", handleMouseMove);
                        window.removeEventListener("mouseup", handleMouseUp);
                      };
                      window.addEventListener("mousemove", handleMouseMove);
                      window.addEventListener("mouseup", handleMouseUp);
                    }}
                  >
                    <div className="relative h-12 w-12 bg-white rounded-full shadow-lg border-2 border-emerald-500 flex items-center justify-center text-emerald-700 font-bold overflow-hidden">
                      <span className="text-[10px] text-center">{player.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromLineup(player.student_id); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] hidden group-hover:flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 text-center italic">اسحب اللاعبين لتغيير مراكزهم في الملعب</p>
        </div>
      </div>
    </div>
  );
}

export default TeamManager;
