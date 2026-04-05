import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import PointsModal from "./PointsModal";
import LeaderboardTicker from "./LeaderboardTicker";
import FootballLeague from "./FootballLeague";
import TasksManager from "./TasksManager";
import LeagueStarManager from "./LeagueStarManager";
import ViewerLinksManager from "./ViewerLinksManager";
import GroupsManager from "./GroupsManager";
import QuduratManager from "./QuduratManager";
import AttendanceManager from "./AttendanceManager";
import TeacherManagement from "./TeacherManagement";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUPERVISOR_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-400", gradient: "from-blue-500 to-blue-600" },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-400", gradient: "from-emerald-500 to-emerald-600" },
  { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-400", gradient: "from-purple-500 to-purple-600" },
  { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-400", gradient: "from-orange-500 to-orange-600" },
  { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-400", gradient: "from-pink-500 to-pink-600" },
  { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-400", gradient: "from-teal-500 to-teal-600" },
];

function Dashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBulkPoints, setShowBulkPoints] = useState(false);
  const [activeSection, setActiveSection] = useState("groups");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [leagueStar, setLeagueStar] = useState(null);
  const [showTeacherManagement, setShowTeacherManagement] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Add student form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSupervisor, setNewSupervisor] = useState("");
  const [newTeacher, setNewTeacher] = useState("");

  // Bulk points
  const [bulkGroup, setBulkGroup] = useState("");
  const [bulkPoints, setBulkPoints] = useState("");
  const [bulkReason, setBulkReason] = useState("");

  // Edit student
  const [editStudent, setEditStudent] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSupervisor, setEditSupervisor] = useState("");
  const [editTeacher, setEditTeacher] = useState("");
  const [editBarcode, setEditBarcode] = useState("");

  const [newBarcode, setNewBarcode] = useState("");
  const headers = {};

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchStudents = useCallback(async () => {
    try {
      const [studentsRes, groupsRes, teachersRes] = await Promise.all([
        axios.get(`${API}/students`),
        axios.get(`${API}/groups`),
        axios.get(`${API}/teachers/list`)
      ]);
      setStudents(studentsRes.data);
      setSupervisors(groupsRes.data.map(g => g.name));
      setTeachers(teachersRes.data);
    } catch {
      showMsg("خطأ في جلب البيانات");
    }
  }, []);

  const fetchLeagueStar = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/league-star`);
      setLeagueStar(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchLeagueStar();
  }, [fetchStudents, fetchLeagueStar]);

  const addStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/students`, { 
        name: newName, 
        phone: newPhone, 
        supervisor: newSupervisor,
        teacher: newTeacher,
        barcode: newBarcode
      }, { headers });
      setNewName(""); setNewPhone(""); setNewSupervisor(""); setNewTeacher(""); setNewBarcode("");
      setShowAddStudent(false);
      showMsg("تمت إضافة الطالب بنجاح");
      await fetchStudents();
    } catch {
      showMsg("خطأ في إضافة الطالب");
    } finally { setLoading(false); }
  };

  const updateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/students/${editStudent.id}`, { 
        name: editName, 
        phone: editPhone, 
        supervisor: editSupervisor,
        teacher: editTeacher,
        barcode: editBarcode
      }, { headers });
      setEditStudent(null);
      showMsg("تم تحديث بيانات الطالب");
      await fetchStudents();
    } catch {
      showMsg("خطأ في التحديث");
    } finally { setLoading(false); }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
    try {
      await axios.delete(`${API}/students/${id}`, { headers });
      showMsg("تم حذف الطالب");
      await fetchStudents();
    } catch {
      showMsg("خطأ في الحذف");
    }
  };

  const updatePoints = async (studentId, points, reason) => {
    setLoading(true);
    try {
      await axios.put(`${API}/students/${studentId}/points`, { points, reason }, { headers });
      showMsg(`تم ${points > 0 ? 'إضافة' : 'خصم'} ${Math.abs(points)} نقطة`);
      setSelectedStudent(null);
      await fetchStudents();
    } catch {
      showMsg("خطأ في تحديث النقاط");
    } finally { setLoading(false); }
  };

  const handleBulkPoints = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/students/bulk-points`, { group: bulkGroup, points: parseInt(bulkPoints), reason: bulkReason }, { headers });
      showMsg("تم تحديث نقاط المجموعة");
      setShowBulkPoints(false);
      setBulkGroup(""); setBulkPoints(""); setBulkReason("");
      await fetchStudents();
    } catch (err) {
      showMsg(err.response?.data?.detail || "خطأ");
    } finally { setLoading(false); }
  };

  const uploadImage = async (studentId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API}/students/${studentId}/upload-image`, formData, {
        headers: { ...headers }
      });
      showMsg("تم رفع الصورة");
      await fetchStudents();
    } catch {
      showMsg("خطأ في رفع الصورة");
    }
  };

  const getColor = (index) => SUPERVISOR_COLORS[index % SUPERVISOR_COLORS.length];
  const FRONTEND_URL = window.location.origin;

  const sections = [
    { id: "groups", label: "المجموعات", icon: "🏅" },
    { id: "students", label: "الطلاب", icon: "👥" },
    { id: "attendance", label: "الحضور", icon: "📱" },
    { id: "tasks", label: "المهام", icon: "📋" },
    { id: "league", label: "الدوري", icon: "⚽" },
    { id: "star", label: "نجم الدوري", icon: "⭐" },
    { id: "viewers", label: "روابط المشاهدة", icon: "🔗" },
    { id: "qudurat", label: "القدرات", icon: "🍿" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-4 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🌱 نادي غِراس</h1>
              <p className="text-green-100 text-sm">🎯 لوحة تحكم المشرف</p>
            </div>
            <div className="flex gap-2">
              <Link to="/challenges" className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-semibold" data-testid="challenges-link">🏆 المنافسات</Link>
              <button onClick={onLogout} className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-semibold" data-testid="logout-btn">🚪 خروج</button>
            </div>
          </div>
        </div>
      </div>

      {/* League Star Banner */}
      {leagueStar && (
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white py-3 px-4">
          <div className="container mx-auto flex items-center justify-center gap-3 text-center">
            <span className="text-xl">⭐</span>
            {leagueStar.image_url && <img src={leagueStar.image_url} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-white/40" />}
            <span className="font-bold">نجم الدوري: {leagueStar.student_name}</span>
            <span className="text-yellow-100 text-sm">✨ {leagueStar.reason}</span>
          </div>
        </div>
      )}

      {/* Leaderboard Ticker */}
      <LeaderboardTicker students={students.slice(0, 10)} />

      {/* Message */}
      {message && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-white border-r-4 border-green-500 text-green-700 p-3 rounded-lg shadow text-center font-semibold animate-fadeIn">{message}</div>
        </div>
      )}

      <div className="container mx-auto px-4 py-4">
        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeSection === s.id ? "bg-green-600 text-white shadow-lg" : "bg-white text-gray-600 shadow hover:bg-gray-50"}`}
              data-testid={`section-${s.id}`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* ===== Groups Section ===== */}
        {activeSection === "groups" && <GroupsManager onGroupsChange={(names) => setSupervisors(names)} />}

        {/* ===== Students Section ===== */}
        {activeSection === "students" && (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowAddStudent(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold" data-testid="add-student-btn">➕ إضافة طالب</button>
              <button onClick={() => setShowTeacherManagement(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold">👨‍🏫 إدارة المعلمين</button>
              <button onClick={() => setShowQRModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold" data-testid="qr-codes-btn">📱 رموز QR</button>
              <button onClick={() => setShowBulkPoints(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold" data-testid="bulk-points-btn">💎 نقاط جماعية</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 text-center shadow-lg border border-green-100">
                <p className="text-xl">👥</p>
                <div className="text-xl font-bold text-green-600">{students.length}</div>
                <div className="text-xs text-gray-500">طالب</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-lg border border-blue-100">
                <p className="text-xl">💎</p>
                <div className="text-xl font-bold text-blue-600">{students.reduce((a, s) => a + s.points, 0)}</div>
                <div className="text-xs text-gray-500">مجموع النقاط</div>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-lg border border-purple-100">
                <p className="text-xl">🏅</p>
                <div className="text-xl font-bold text-purple-600">{supervisors.length}</div>
                <div className="text-xs text-gray-500">مجموعة</div>
              </div>
            </div>

            {/* Teacher Stats (Optional but helpful) */}
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="text-sm font-bold text-gray-700">المعلمون النشطون:</span>
              {[...new Set(students.map(s => s.teacher).filter(Boolean))].map(t => (
                <span key={t} className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">{t}</span>
              ))}
              {students.filter(s => s.teacher).length === 0 && <span className="text-xs text-gray-400">لا يوجد معلمون محددون</span>}
            </div>

            {/* Students by Group */}
            {supervisors.map((sup, si) => {
              const color = getColor(si);
              const groupStudents = students.filter(s => s.supervisor === sup);
              return (
                <div key={sup} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className={`bg-gradient-to-r ${color.gradient} text-white p-3 flex items-center justify-between`}>
                    <h3 className="font-bold">🏅 {sup}</h3>
                    <span className="bg-white/20 px-3 py-0.5 rounded-full text-sm">{groupStudents.length} طالب</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {groupStudents.map(student => (
                      <div key={student.id} className={`flex items-center gap-3 p-2 rounded-lg border ${color.border} bg-gray-50 hover:bg-white transition`}>
                        {/* Image */}
                        <div className="relative">
                          {student.image_url ? (
                            <img src={student.image_url} alt="" className={`w-10 h-10 rounded-full object-cover border-2 ${color.border}`} />
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${color.bg} ${color.text} flex items-center justify-center font-bold`}>
                              {student.name.charAt(0)}
                            </div>
                          )}
                          <label className="absolute -bottom-1 -left-1 w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer text-xs hover:bg-gray-400">
                            +
                            <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) uploadImage(student.id, e.target.files[0]); }} />
                          </label>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{student.name}</p>
                          {student.phone && <p className="text-xs text-gray-400">{student.phone}</p>}
                        </div>

                        {/* Points */}
                        <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2 py-0.5 rounded-full text-sm font-bold">{student.points} ⭐</span>

                        {/* Actions */}
                        <div className="flex gap-1">
                          <button onClick={() => setSelectedStudent(student)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold" data-testid={`points-btn-${student.id}`}>نقاط</button>
                          <button onClick={() => { 
                            setEditStudent(student); 
                            setEditName(student.name); 
                            setEditPhone(student.phone || ""); 
                            setEditSupervisor(student.supervisor || "");
                            setEditTeacher(student.teacher || "");
                            setEditBarcode(student.barcode || "");
                          }}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs" data-testid={`edit-btn-${student.id}`}>تعديل</button>
                          <button onClick={() => deleteStudent(student.id)} className="text-red-400 hover:text-red-600 text-sm" data-testid={`delete-btn-${student.id}`}>&#10005;</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Ungrouped students */}
            {students.filter(s => !s.supervisor).length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gray-500 text-white p-3"><h3 className="font-bold">بدون مجموعة</h3></div>
                <div className="p-3 space-y-2">
                  {students.filter(s => !s.supervisor).map(student => (
                    <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-300 bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold">{student.name.charAt(0)}</div>
                      <div className="flex-1"><p className="font-semibold text-sm">{student.name}</p></div>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-sm font-bold">{student.points} ⭐</span>
                      <div className="flex gap-1">
                        <button onClick={() => setSelectedStudent(student)} className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">نقاط</button>
                        <button onClick={() => { 
                          setEditStudent(student); 
                          setEditName(student.name); 
                          setEditPhone(student.phone || ""); 
                          setEditSupervisor(student.supervisor || "");
                          setEditTeacher(student.teacher || "");
                          setEditBarcode(student.barcode || "");
                        }}
                          className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs">تعديل</button>
                        <button onClick={() => deleteStudent(student.id)} className="text-red-400 hover:text-red-600 text-sm">&#10005;</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== Attendance Section ===== */}
        {activeSection === "attendance" && <AttendanceManager onAttendanceChange={fetchStudents} />}

        {/* ===== Tasks Section ===== */}
        {activeSection === "tasks" && <TasksManager supervisors={supervisors} />}

        {/* ===== League Section ===== */}
        {activeSection === "league" && <FootballLeague supervisors={supervisors} />}

        {/* ===== Star Section ===== */}
        {activeSection === "star" && <LeagueStarManager />}

        {/* ===== Viewers Section ===== */}
        {activeSection === "viewers" && <ViewerLinksManager />}

        {/* ===== Qudurat Section ===== */}
        {activeSection === "qudurat" && <QuduratManager />}
      </div>

      {/* ===== Modals ===== */}

      {/* Points Modal */}
      {selectedStudent && (
        <PointsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdatePoints={updatePoints} loading={loading} />
      )}

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddStudent(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">إضافة طالب جديد</h3>
            <form onSubmit={addStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">اسم الطالب *</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" placeholder="الاسم الكامل" required data-testid="new-student-name" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">جوال ولي الأمر</label>
                <input type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" placeholder="05xxxxxxxx" data-testid="new-student-phone" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">المجموعة *</label>
                <select value={newSupervisor} onChange={e => setNewSupervisor(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" required data-testid="new-student-supervisor">
                  <option value="">اختر المجموعة</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {supervisors.length === 0 && <p className="text-xs text-red-500 mt-1">⚠️ أضف مجموعة أولاً من قسم المجموعات</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">المعلم *</label>
                <select value={newTeacher} onChange={e => setNewTeacher(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" required>
                  <option value="">اختر المعلم</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {teachers.length === 0 && <p className="text-xs text-red-500 mt-1">⚠️ أضف معلم أولاً من زر "إدارة المعلمين"</p>}
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-add-student">
                  {loading ? "جاري الإضافة..." : "إضافة"}
                </button>
                <button type="button" onClick={() => setShowAddStudent(false)} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setEditStudent(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">تعديل بيانات الطالب</h3>
            <form onSubmit={updateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">الاسم</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">الجوال</label>
                <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">المجموعة</label>
                <select value={editSupervisor} onChange={e => setEditSupervisor(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500">
                  <option value="">بدون مجموعة</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">📚 اسم المعلم (القرآن)</label>
                <select 
                  value={editTeacher} 
                  onChange={e => setEditTeacher(e.target.value)} 
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500"
                >
                  <option value="">اختر المعلم</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">💡 اختر المعلم ليتمكن من الدخول وحفظ الدرجات</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">📊 رقم الباركود</label>
                <input 
                  type="text" 
                  value={editBarcode} 
                  onChange={e => setEditBarcode(e.target.value)} 
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-green-500" 
                  placeholder="رقم باركود الطالب" 
                />
                <p className="text-xs text-gray-500 mt-1">💡 يُستخدم لتسجيل الحضور بمسح الباركود</p>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold disabled:opacity-50">تحديث</button>
                <button type="button" onClick={() => setEditStudent(null)} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Codes Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowQRModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">رموز QR للطلاب</h3>
              <button onClick={() => { window.print(); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold print:hidden">🖨️ طباعة</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" id="qr-print-area">
              {students.map(s => {
                const studentLink = `${FRONTEND_URL}/public/${s.id}`;
                const copyLink = () => {
                  navigator.clipboard.writeText(studentLink);
                  showMsg(`تم نسخ رابط ${s.name}`);
                };
                return (
                  <div key={s.id} className="text-center border-2 border-gray-200 rounded-lg p-3 break-inside-avoid">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(studentLink)}`} alt="QR" className="mx-auto mb-2" />
                    <p className="text-sm font-bold truncate mb-1">{s.name}</p>
                    {s.barcode && (
                      <p className="text-lg font-bold text-blue-700 bg-blue-50 rounded-lg py-1 px-2 border border-blue-200 mb-2">
                        🔢 {s.barcode}
                      </p>
                    )}
                    <button onClick={copyLink} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs font-bold print:hidden">
                      📋 نسخ الرابط
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowQRModal(false)} className="w-full mt-4 bg-gray-500 text-white py-2 rounded-lg font-bold print:hidden">إغلاق</button>
          </div>
        </div>
      )}

      {/* Bulk Points Modal */}
      {showBulkPoints && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowBulkPoints(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">نقاط جماعية للمجموعة</h3>
            <form onSubmit={handleBulkPoints} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">المجموعة</label>
                <select value={bulkGroup} onChange={e => setBulkGroup(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-purple-500" required data-testid="bulk-group">
                  <option value="">اختر المجموعة</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">النقاط</label>
                <input type="number" value={bulkPoints} onChange={e => setBulkPoints(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-purple-500" placeholder="مثال: 50 أو -20" required data-testid="bulk-points-input" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">السبب</label>
                <input type="text" value={bulkReason} onChange={e => setBulkReason(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-purple-500" placeholder="سبب إضافة/خصم النقاط" required data-testid="bulk-reason" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-bulk-points">تطبيق</button>
                <button type="button" onClick={() => setShowBulkPoints(false)} className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showTeacherManagement && (
        <TeacherManagement onClose={() => { setShowTeacherManagement(false); fetchStudents(); }} />
      )}

      {/* Footer */}
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="text-sm text-gray-400">Made with ❤️ by Aboughaith</p>
      </div>
    </div>
  );
}

export default Dashboard;
