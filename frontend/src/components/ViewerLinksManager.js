import { useState, useEffect } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FRONTEND_URL = window.location.origin;

function ViewerLinksManager() {
  const [links, setLinks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const headers = {};

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`${API}/viewer-links`, { headers });
      setLinks(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchLinks(); }, []);

  const addLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/viewer-links`, { name }, { headers });
      setShowAdd(false);
      setName("");
      setMessage("تم إنشاء رابط المشاهدة");
      await fetchLinks();
    } catch (err) {
      setMessage("خطأ في الإنشاء");
    } finally { setLoading(false); }
  };

  const deleteLink = async (id) => {
    if (!window.confirm("حذف هذا الرابط؟")) return;
    try {
      await axios.delete(`${API}/viewer-links/${id}`, { headers });
      await fetchLinks();
    } catch (err) { console.error(err); }
  };

  const copyLink = (linkToken) => {
    const url = `${FRONTEND_URL}/view/${linkToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(linkToken);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(""), 3000); return () => clearTimeout(t); } }, [message]);

  return (
    <div className="space-y-4">
      {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center font-semibold">{message}</div>}

      <button onClick={() => setShowAdd(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold" data-testid="add-viewer-link-btn">
        + إضافة رابط مشاهدة
      </button>

      <div className="space-y-3">
        {links.map(link => (
          <div key={link.id} className="bg-white rounded-xl shadow p-4 border-r-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-800">{link.name}</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">{FRONTEND_URL}/view/{link.token}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyLink(link.token)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${copiedId === link.token ? "bg-green-500 text-white" : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"}`}
                  data-testid={`copy-link-${link.token}`}
                >
                  {copiedId === link.token ? "تم النسخ!" : "نسخ الرابط"}
                </button>
                <button onClick={() => deleteLink(link.id)} className="text-red-400 hover:text-red-600 text-lg">&#10005;</button>
              </div>
            </div>
          </div>
        ))}
        {links.length === 0 && <div className="text-center py-4 text-gray-500">لا توجد روابط مشاهدة</div>}
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-bold mb-4">إضافة رابط مشاهدة</h3>
            <form onSubmit={addLink} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">اسم المشرف الفرعي</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-indigo-500" placeholder="مثال: أ. محمد" required data-testid="viewer-name" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold disabled:opacity-50" data-testid="submit-viewer-link">
                  {loading ? "جاري الإنشاء..." : "إنشاء الرابط"}
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

export default ViewerLinksManager;
