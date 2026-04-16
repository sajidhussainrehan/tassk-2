import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function AttendanceManager({ onAttendanceChange }) {
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [timerActive, setTimerActive] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState("00:00");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [stats, setStats] = useState({ early: 0, late: 0, absent: 0, total: 0 });
  const [scannedStudent, setScannedStudent] = useState(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch students list
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/students`);
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const res = await axios.get(`${API}/attendance/today`);
      if (res.data.session) {
        setSession(res.data.session);
        setRecords(res.data.records);
        setSessionStarted(true);
        setTimerActive(res.data.session.is_active);
        updateStats(res.data.records);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchTodayAttendance();

    // Load html5-qrcode script
    if (!window.Html5Qrcode) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Timer functionality
  useEffect(() => {
    let interval;
    if (session && session.started_at && !session.is_finalized) {
      const startTime = new Date(session.started_at).getTime();
      const endTime = session.ended_at ? new Date(session.ended_at).getTime() : null;
      
      if (endTime) {
        const diff = endTime - startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const display = hours > 0 
          ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setTimerDisplay(display);
      } else {
        interval = setInterval(() => {
          const now = new Date().getTime();
          const diff = now - startTime;
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          const display = hours > 0 
            ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          setTimerDisplay(display);
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [session]);

  const updateStats = (attendanceRecords) => {
    const early = attendanceRecords.filter(r => r.status === "early").length;
    const late = attendanceRecords.filter(r => r.status === "late").length;
    const absent = attendanceRecords.filter(r => r.status === "absent").length;
    setStats({ early, late, absent, total: attendanceRecords.length });
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/attendance/start`);
      setSession(res.data);
      setSessionStarted(true);
      setTimerActive(true);
      setMessage("✅ تم بدء جلسة الحضور");
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setMessage("❌ خطأ في بدء الجلسة");
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/attendance/${session.id}/stop`);
      setTimerActive(false);
      setSession({ ...session, is_active: false, ended_at: res.data.ended_at });
      setMessage("⏹️ تم إيقاف المؤقت - بداية فترة التأخير (-10 نقاط)");
    } catch (err) {
      setMessage("❌ خطأ في إيقاف المؤقت");
    } finally {
      setLoading(false);
    }
  };

  const parseBarcode = (input) => {
    const trimmed = input.trim();
    const publicMatch = trimmed.match(/\/public\/([a-f0-9-]+)/i);
    if (publicMatch) return publicMatch[1];
    const uuidMatch = trimmed.match(/^[a-f0-9-]{36}$/i);
    if (uuidMatch) return trimmed;
    return trimmed;
  };

  const handleBarcodeSubmit = async (e, qrText = null) => {
    if (e) e.preventDefault();
    const val = qrText || barcodeInput;
    if (!val.trim() || !session) return;

    const parsedInput = parseBarcode(val);
    const student = students.find(s => 
      s.id.toLowerCase() === parsedInput.toLowerCase() ||
      s.id.toLowerCase() === val.trim().toLowerCase() ||
      (s.barcode && s.barcode.toLowerCase() === val.trim().toLowerCase()) ||
      (s.barcode && s.barcode.toLowerCase() === parsedInput.toLowerCase()) ||
      s.name.includes(val.trim())
    );

    if (!student) {
      setMessage("❌ الطالب غير موجود - تأكد من مسح باركود صحيح");
      setScannedStudent(null);
      setBarcodeInput("");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/attendance/${session.id}/scan`, {
        student_id: student.id,
        barcode: val
      });

      if (res.data.already_scanned) {
        setMessage("⚠️ تم تسجيل حضور هذا الطالب مسبقاً");
      } else {
        const { student: scannedStu, status, points } = res.data;
        setScannedStudent({ ...scannedStu, status, points });
        setMessage(`${status === "early" ? "✅" : "⚠️"} ${scannedStu.name}: ${status === "early" ? "حضور مبكر" : "حضور متأخر"} (${points > 0 ? "+" : ""}${points} نقطة)`);
        
        const newRecord = {
          id: Date.now().toString(),
          student_id: scannedStu.id,
          student_name: scannedStu.name,
          status,
          points,
          scanned_at: new Date().toISOString()
        };
        const updatedRecords = [...records, newRecord];
        setRecords(updatedRecords);
        updateStats(updatedRecords);
        if (onAttendanceChange) onAttendanceChange();
      }
    } catch (err) {
      setMessage("❌ خطأ في تسجيل الحضور");
    } finally {
      setLoading(false);
      setBarcodeInput("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const startScanning = () => {
    if (!window.Html5Qrcode) {
      alert("جاري تحميل نظام المسح... يرجى المحاولة بعد قليل");
      return;
    }
    setScanning(true);
    setTimeout(() => {
      const html5QrCode = new window.Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setBarcodeInput(decodedText);
          handleBarcodeSubmit({ preventDefault: () => {} }, decodedText);
          stopScanning();
        },
        () => {}
      ).catch(() => {
        setScanning(false);
        alert("خطأ في تشغيل الكاميرا");
      });
    }, 500);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        setScanning(false);
      }).catch(() => setScanning(false));
    } else {
      setScanning(false);
    }
  };

  const finalizeAttendance = async () => {
    if (!session) return;
    if (!window.confirm("هل أنت متأكد من إنهاء الحضور؟ سيتم تسجيل الغائبين وخصم 30 نقطة.")) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/attendance/${session.id}/finalize`);
      setMessage(`✅ تم إنهاء الحضور: ${res.data.present_count} حاضر، ${res.data.absent_count} غائب`);
      const updatedRes = await axios.get(`${API}/attendance/today`);
      setRecords(updatedRes.data.records);
      updateStats(updatedRes.data.records);
      setSession({ ...session, is_finalized: true });
      setTimerActive(false);
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setMessage("❌ خطأ في إنهاء الحضور");
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/attendance/start`);
      setSession(res.data);
      setRecords([]);
      setSessionStarted(true);
      setTimerActive(true);
      setTimerDisplay("00:00");
      setStats({ early: 0, late: 0, absent: 0, total: 0 });
      setScannedStudent(null);
      setMessage("✅ تم بدء جلسة حضور جديدة");
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setMessage("❌ خطأ في بدء الجلسة الجديدة");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "early": return "bg-green-100 text-green-700 border-green-300";
      case "late": return "bg-orange-100 text-orange-700 border-orange-300";
      case "absent": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "early": return "✅";
      case "late": return "⚠️";
      case "absent": return "❌";
      default: return "❓";
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 rounded-xl shadow-md border-b-4 border-green-800">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📱</span>
          <span>نظام تسجيل الحضور</span>
        </h2>
        <p className="text-sm mt-1 text-green-100">مسح الباركود لتسجيل حضور الطلاب تلقائياً</p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-center font-semibold border ${
          message.includes("✅") ? "bg-green-50 text-green-700 border-green-200" :
          message.includes("⚠️") ? "bg-orange-50 text-orange-700 border-orange-200" :
          "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message}
        </div>
      )}

      {scannedStudent && (
        <div className={`p-4 rounded-xl text-center animate-bounce duration-500 ${
          scannedStudent.status === "early" ? "bg-green-50 border-2 border-green-500" : "bg-orange-50 border-2 border-orange-500"
        }`}>
          <div className="text-4xl mb-2">{scannedStudent.status === "early" ? "🌟" : "⏰"}</div>
          <h3 className="text-lg font-bold text-gray-800">{scannedStudent.name}</h3>
          <p className={`text-sm font-bold ${scannedStudent.points > 0 ? "text-green-600" : "text-red-600"}`}>
            {scannedStudent.status === "early" ? "حضور مبكر" : "حضور متأخر"}
            <br />
            {scannedStudent.points > 0 ? "+" : ""}{scannedStudent.points} نقطة
          </p>
        </div>
      )}

      {!sessionStarted ? (
        <button onClick={startSession} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all">
          {loading ? "جاري البدء..." : "▶️ بدء جلسة الحضور"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-900 text-green-400 p-4 rounded-xl text-center border-2 border-green-600">
            <p className="text-sm font-semibold mb-1">⏱️ مؤقت الحضور المبكر</p>
            <p className="text-4xl font-mono font-bold tracking-widest">{timerDisplay}</p>
            <p className={`text-sm mt-2 font-bold ${timerActive ? "text-green-400" : "text-orange-400"}`}>
              {timerActive ? "✅ فترة الحضور المبكر (+20 نقطة)" : "⚠️ فترة التأخير (-10 نقاط)"}
            </p>
          </div>

          {timerActive && (
            <button onClick={stopTimer} disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold border-b-4 border-orange-700 shadow-md">
              ⏹️ إيقاف المؤقت (بدء فترة التأخير)
            </button>
          )}

          {!session?.is_finalized && (
            <div className="bg-white p-4 rounded-xl border-2 border-gray-200 space-y-4 shadow-sm">
              <form onSubmit={handleBarcodeSubmit} className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">🔍 إدخال الباركود:</label>
                <div className="flex gap-2">
                  <input ref={inputRef} type="text" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} placeholder="امسح هنا..." className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-green-500 text-lg bg-gray-50" disabled={loading} autoFocus />
                  <button type="submit" disabled={loading || !barcodeInput.trim()} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-md">إدخال</button>
                </div>
              </form>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 text-center">
                {!scanning ? (
                  <button onClick={startScanning} className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-md">
                    <span>📷</span> إدخال عبر الكاميرا
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div id="reader" className="overflow-hidden rounded-lg border-2 border-teal-500 bg-black"></div>
                    <button onClick={stopScanning} className="w-full py-2 bg-red-500 text-white rounded-lg font-bold">إيقاف الكاميرا</button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 p-3 rounded-xl text-center border border-green-200">
              <p className="text-xl font-bold text-green-700">{stats.early}</p>
              <p className="text-xs font-bold text-green-600">مبكر</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-xl text-center border border-orange-200">
              <p className="text-xl font-bold text-orange-700">{stats.late}</p>
              <p className="text-xs font-bold text-orange-600">متأخر</p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl text-center border border-red-200">
              <p className="text-xl font-bold text-red-700">{stats.absent}</p>
              <p className="text-xs font-bold text-red-600">غائب</p>
            </div>
          </div>

          <button onClick={finalizeAttendance} disabled={loading || session?.is_finalized} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg disabled:hidden">
            🔒 إنهاء الجلسة وتسجيل الغياب
          </button>

          {session?.is_finalized && (
            <div className="bg-gray-100 p-6 rounded-xl text-center border-2 border-dashed border-gray-400 space-y-4">
              <p className="text-lg font-bold text-gray-700">🔒 تم إنهاء جلسة اليوم</p>
              <button onClick={startNewSession} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all">🔄 بدء جلسة جديدة</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AttendanceManager;
