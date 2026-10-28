import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { resolveImageUrl } from "../lib/utils";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

const SCANNER_ELEMENT_ID = "attendance-reader";
const RESULT_DISPLAY_MS = 1500;

const STATUSES = ["present", "late", "absent", "excused"];

const STATUS_INFO = {
  present: { label: "حاضر", points: "+20", chip: "bg-green-100 text-green-700 border-green-300", active: "bg-green-600 border-green-600 text-white" },
  late: { label: "متأخر", points: "-10", chip: "bg-orange-100 text-orange-700 border-orange-300", active: "bg-orange-500 border-orange-500 text-white" },
  absent: { label: "غائب", points: "-30", chip: "bg-red-100 text-red-700 border-red-300", active: "bg-red-600 border-red-600 text-white" },
  excused: { label: "معذور", points: "0", chip: "bg-gray-100 text-gray-700 border-gray-300", active: "bg-gray-600 border-gray-600 text-white" },
  not_recorded: { label: "لم يسجل", chip: "bg-white text-gray-400 border-gray-200" },
};

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
};

function StatusChip({ status, points }) {
  const info = STATUS_INFO[status] || STATUS_INFO.not_recorded;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${info.chip}`}>
      {info.label}
      {points !== undefined && points !== null && ` ${points > 0 ? "+" : ""}${points}`}
    </span>
  );
}

// Works like the Quran site's attendance: open whenever needed, scan or tap each student,
// correct any status later, and close to mark everyone not recorded as absent.
function AttendanceManager({ onAttendanceChange }) {
  const [data, setData] = useState(null); // { session, roster, counts }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [recent, setRecent] = useState([]);
  const [confirmClose, setConfirmClose] = useState(false);
  const [filter, setFilter] = useState("all");
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const inputRef = useRef(null);

  const session = data?.session;
  const isOpen = session && !session.is_closed;

  const fetchCurrent = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/attendance/current`);
      setData(res.data.session ? res.data : null);
    } catch {
      setMessage("❌ خطأ في جلب الحضور");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrent();
    // Load html5-qrcode script for camera scanning
    if (!window.Html5Qrcode) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [fetchCurrent]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);

  // Wraps an action that returns the updated attendance view
  const run = async (action, successMsg) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await action();
      if (res?.data?.session) setData(res.data);
      else await fetchCurrent();
      if (successMsg) setMessage(typeof successMsg === "function" ? successMsg(res.data) : successMsg);
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.detail || "حدث خطأ"}`);
    } finally {
      setBusy(false);
    }
  };

  const openAttendance = () => run(() => axios.post(`${API}/attendance/open`), "✅ تم فتح الحضور");

  const setLatePeriod = (enabled) => run(
    () => axios.post(`${API}/attendance/${session.id}/late-period`, { enabled }),
    enabled ? "⏰ بدأت فترة التأخير: من يُسجَّل الآن يُحسب متأخراً" : "↩️ تم إلغاء فترة التأخير"
  );

  const closeAttendance = () => {
    setConfirmClose(false);
    stopScanning();
    run(
      () => axios.post(`${API}/attendance/${session.id}/close`),
      (res) => `🔒 تم إغلاق الحضور — سُجِّل ${res.marked_absent} غائب`
    );
  };

  const setStatus = (entry, status) => {
    if (entry.status === status) return;
    run(() => axios.put(`${API}/attendance/${session.id}/students/${entry.student_id}`, { status }));
  };

  const scanCode = useCallback(async (code) => {
    if (!code.trim() || !session || processingRef.current) return;
    processingRef.current = true;
    try {
      if (scannerRef.current?.getState?.() === 2) scannerRef.current.pause(true); // 2 = SCANNING
    } catch { /* not pausable */ }
    setScanError("");

    try {
      const res = await axios.post(`${API}/attendance/${session.id}/scan`, { code });
      const view = { ...res.data };
      setResult(view);
      setRecent((prev) => [view, ...prev].slice(0, 5));
      await fetchCurrent();
      if (onAttendanceChange) onAttendanceChange();
    } catch (err) {
      setScanError(err.response?.data?.detail || "لم يتم العثور على طالب بهذا الرمز");
    } finally {
      setTimeout(() => {
        setResult(null);
        setScanError("");
        processingRef.current = false;
        try {
          if (scannerRef.current?.getState?.() === 3) scannerRef.current.resume(); // 3 = PAUSED
        } catch { /* not resumable */ }
        inputRef.current?.focus();
      }, RESULT_DISPLAY_MS);
    }
  }, [session, fetchCurrent, onAttendanceChange]);

  // The camera callback is created once; keep it pointing at the latest scanCode
  const scanCodeRef = useRef(scanCode);
  useEffect(() => { scanCodeRef.current = scanCode; }, [scanCode]);

  const onManualSubmit = async (e) => {
    e.preventDefault();
    const code = codeInput.trim();
    if (!code) return;
    setCodeInput("");
    await scanCode(code);
  };

  const startScanning = () => {
    if (!window.Html5Qrcode) {
      alert("جاري تحميل نظام المسح... يرجى المحاولة بعد قليل");
      return;
    }
    setScanning(true);
    setTimeout(() => {
      const scanner = new window.Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => scanCodeRef.current(decodedText),
        () => {}
      ).catch(() => {
        scannerRef.current = null;
        setScanning(false);
        alert("تعذر تشغيل الكاميرا - استخدم الإدخال اليدوي");
      });
    }, 300);
  };

  const stopScanning = () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      scanner.stop().then(() => scanner.clear()).catch(() => undefined);
    } catch { /* never started */ }
  };

  // Stop the camera when leaving the page
  useEffect(() => () => {
    try { scannerRef.current?.stop().catch(() => undefined); } catch { /* never started */ }
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">⏳ جاري التحميل...</div>;
  }

  const counts = data?.counts || {};
  const groups = [...new Set((data?.roster || []).map(r => r.group).filter(Boolean))];
  const roster = (data?.roster || []).filter(r => filter === "all" || r.group === filter);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 rounded-xl shadow-md flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">📱 الحضور</h2>
          <p className="text-sm text-green-100">
            {!session ? "الحضور غير مفتوح" :
              session.is_closed ? `مغلق — ${formatTime(session.closed_at)}` :
              `مفتوح منذ ${formatTime(session.opened_at)}`}
          </p>
        </div>
        {isOpen ? (
          <button onClick={() => setConfirmClose(true)} disabled={busy} className="bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold shadow disabled:opacity-50" data-testid="close-attendance-btn">
            🔒 إغلاق الجلسة
          </button>
        ) : (
          <button onClick={openAttendance} disabled={busy} className="bg-white text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg font-bold shadow disabled:opacity-50" data-testid="open-attendance-btn">
            ▶️ {session ? "فتح حضور جديد" : "فتح الحضور"}
          </button>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-center font-semibold border ${message.startsWith("❌") ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
          {message}
        </div>
      )}

      {!session && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          افتح الحضور متى ما بدأت الحلقة، ثم امسح بطاقات الطلاب أو اختر حالة كل طالب.
        </div>
      )}

      {isOpen && (
        <>
          {/* Late period switch - the supervisor decides when lateness starts */}
          <div className={`rounded-xl p-4 border-2 flex items-center justify-between gap-3 flex-wrap ${session.is_late_period ? "bg-orange-50 border-orange-300" : "bg-green-50 border-green-300"}`}>
            <div>
              <p className={`font-bold ${session.is_late_period ? "text-orange-700" : "text-green-700"}`}>
                {session.is_late_period ? `⏰ فترة التأخير (منذ ${formatTime(session.late_since)})` : "✅ وقت الحضور"}
              </p>
              <p className="text-xs text-gray-600">
                {session.is_late_period ? "من يُمسح الآن يُسجَّل متأخراً (-10)" : "من يُمسح الآن يُسجَّل حاضراً (+20)"}
              </p>
            </div>
            <button
              onClick={() => setLatePeriod(!session.is_late_period)}
              disabled={busy}
              className={`px-4 py-2 rounded-lg font-bold text-white shadow disabled:opacity-50 ${session.is_late_period ? "bg-gray-500 hover:bg-gray-600" : "bg-orange-500 hover:bg-orange-600"}`}
              data-testid="late-period-btn"
            >
              {session.is_late_period ? "↩️ إلغاء فترة التأخير" : "⏰ بدء فترة التأخير"}
            </button>
          </div>

          {/* Scanner */}
          <div className="bg-white p-4 rounded-xl border-2 border-gray-200 space-y-3 shadow-sm">
            <div className="text-center">
              {!scanning ? (
                <button onClick={startScanning} className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-md" data-testid="start-camera-btn">
                  📷 المسح بالكاميرا
                </button>
              ) : (
                <div className="space-y-2">
                  <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-lg border-2 border-teal-500 bg-black max-w-sm mx-auto"></div>
                  <p className="text-sm text-gray-500">وجّه الكاميرا نحو رمز الطالب</p>
                  <button onClick={stopScanning} className="w-full py-2 bg-red-500 text-white rounded-lg font-bold">إيقاف الكاميرا</button>
                </div>
              )}
            </div>

            <div aria-live="assertive" className="min-h-[1rem]">
              {result && (
                <div className={`p-3 rounded-xl text-center border-2 ${result.status === "late" ? "bg-orange-50 border-orange-400" : "bg-green-50 border-green-400"}`}>
                  {result.student.image_url ? (
                    <img src={resolveImageUrl(result.student.image_url)} alt="" className="w-14 h-14 rounded-full object-cover mx-auto mb-1" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 mx-auto mb-1 flex items-center justify-center text-xl font-bold">{(result.student.name || "?").charAt(0)}</div>
                  )}
                  <p className="font-bold text-lg">{result.student.name}</p>
                  <StatusChip status={result.status} points={result.points} />
                  {result.already_recorded && <p className="text-xs text-gray-500 mt-1">تم تسجيل هذا الطالب مسبقاً</p>}
                </div>
              )}
              {scanError && <div className="p-3 rounded-xl text-center border border-red-300 bg-red-50 text-red-700 font-semibold">{scanError}</div>}
            </div>

            <form onSubmit={onManualSubmit} className="flex gap-2">
              <input ref={inputRef} type="text" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="إدخال يدوي للباركود..." className="flex-1 px-4 py-3 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-green-500 bg-gray-50" autoFocus data-testid="barcode-input" />
              <button type="submit" disabled={!codeInput.trim()} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold shadow-md disabled:opacity-50">تأكيد</button>
            </form>

            {recent.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">آخر عمليات المسح</p>
                <div className="flex gap-2 overflow-x-auto">
                  {recent.map((r, i) => (
                    <div key={i} className="flex shrink-0 items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs">
                      {r.student.name}
                      <StatusChip status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {session && (
        <>
          {/* Counts */}
          <div className="grid grid-cols-5 gap-2">
            {[...STATUSES, "not_recorded"].map(s => (
              <div key={s} className={`p-2 rounded-xl text-center border ${STATUS_INFO[s].chip}`}>
                <p className="text-xl font-bold">{counts[s] || 0}</p>
                <p className="text-xs font-bold">{STATUS_INFO[s].label}</p>
              </div>
            ))}
          </div>

          {groups.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded-full text-sm font-semibold ${filter === "all" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}>الكل</button>
              {groups.map(g => (
                <button key={g} onClick={() => setFilter(g)} className={`px-3 py-1 rounded-full text-sm font-semibold ${filter === g ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}>{g}</button>
              ))}
            </div>
          )}

          {/* Roster: every student with a status, correctable at any time */}
          <div className="space-y-2">
            {roster.map(entry => (
              <div key={entry.student_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  {entry.image_url ? (
                    <img src={resolveImageUrl(entry.image_url)} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">{(entry.name || "?").charAt(0)}</div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{entry.name}</p>
                    {entry.group && <p className="text-xs text-gray-400">{entry.group}</p>}
                  </div>
                  <StatusChip status={entry.status} points={entry.status === "not_recorded" ? undefined : entry.points} />
                </div>
                <div className="flex gap-1" role="group" aria-label={entry.name}>
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatus(entry, status)}
                      disabled={busy}
                      className={`min-h-9 rounded-md border px-2 text-xs font-semibold transition-colors ${entry.status === status ? STATUS_INFO[status].active : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-200"}`}
                      data-testid={`set-${status}-${entry.student_id}`}
                    >
                      {STATUS_INFO[status].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {roster.length === 0 && <div className="text-center py-8 text-gray-500">لا يوجد طلاب</div>}
          </div>
        </>
      )}

      {/* Close confirmation */}
      {confirmClose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmClose(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-3">إغلاق الجلسة</h3>
            <p className="text-sm text-gray-600 mb-5">
              {counts.not_recorded
                ? `سيتم تسجيل ${counts.not_recorded} طالب كغائب (-30). هل تريد المتابعة؟`
                : "تم تسجيل جميع الطلاب. هل تريد إغلاق الحضور؟"}
            </p>
            <div className="flex gap-3">
              <button onClick={closeAttendance} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold" data-testid="confirm-close-btn">تأكيد</button>
              <button onClick={() => setConfirmClose(false)} className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-3 rounded-lg font-bold">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceManager;
