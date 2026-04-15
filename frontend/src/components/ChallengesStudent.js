import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");
const API = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

function ChallengesStudent({ studentId, studentName }) {
    const [challenges, setChallenges] = useState([]);
    const [answeredIds, setAnsweredIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [challengesRes, answeredRes] = await Promise.all([
                    axios.get(`${API}/challenges`),
                    axios.get(`${API}/students/${studentId}/points-log`)
                ]);
                
                setChallenges(challengesRes.data || []);
            } catch (err) {
                console.error("Error fetching student challenges:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    const handleAnswer = async (challengeId, answerIndex) => {
        if (submitting || answeredIds.has(challengeId)) return;
        
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/challenges/${challengeId}/answer/${studentId}`, {
                answer: answerIndex,
                student_name: studentName
            });
            
            if (res.data.correct) {
                alert(`إجابة صحيحة! حصلت على ${res.data.points} نقطة 🎉`);
            } else {
                alert("إجابة خاطئة، حاول في المرة القادمة!");
            }
            
            setAnsweredIds(prev => new Set(prev).add(challengeId));
        } catch (err) {
            console.error("Error submitting answer:", err);
            alert("حدث خطأ أثناء إرسال الإجابة");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;
    
    const now = new Date();
    // Filter out inactive (disabled) challenges and expired challenges
    const visibleChallenges = challenges.filter(c => {
        if (!c.is_active) return false;
        const end = c.end_time ? new Date(c.end_time) : null;
        if (end && end < now) return false; // Hide expired
        return true;
    });

    if (visibleChallenges.length === 0) return null;

    const formatDateTime = (dt) => {
        if (!dt) return null;
        const d = new Date(dt);
        return d.toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="space-y-6" id="challenges">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-lime-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">🎯</div>
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] leading-none mb-1">Competition Dashboard</h3>
                    <p className="text-2xl font-black text-gray-800">المنافسات النشطة 🎯</p>
                </div>
            </div>

            {visibleChallenges.map(challenge => {
                const start = challenge.start_time ? new Date(challenge.start_time) : null;
                const end = challenge.end_time ? new Date(challenge.end_time) : null;
                const isUpcoming = start && start > now;
                const isEndingSoon = end && (end - now) < (1000 * 60 * 60 * 24); // Less than 24h

                return (
                    <div key={challenge.id} className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-gray-200 border-2 border-transparent hover:border-lime-500/20 transition-all group relative overflow-hidden mb-8">
                        {/* Status Accents */}
                        <div className={`absolute top-0 left-0 w-full h-2 ${isUpcoming ? "bg-blue-500" : isEndingSoon ? "bg-rose-500" : "bg-lime-500"}`}></div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-full -mr-24 -mt-24 transition-transform group-hover:scale-110"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`px-5 py-2 rounded-full border-2 font-black text-[10px] uppercase tracking-widest ${
                                        isUpcoming 
                                            ? "bg-blue-50 text-blue-600 border-blue-100" 
                                            : isEndingSoon 
                                                ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" 
                                                : "bg-lime-50 text-lime-600 border-lime-100"
                                    }`}>
                                        {isUpcoming ? "قريباً جداً" : isEndingSoon ? "فرصة أخيرة" : "منافسة جارية"}
                                    </div>
                                    {end && !isUpcoming && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <span className="text-xs">⌛</span>
                                            <span className="text-[10px] font-bold uppercase tracking-tighter">ينتهي: {formatDateTime(end)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right leading-none">
                                    <span className={`text-4xl font-black italic ${isUpcoming ? "text-gray-300" : "text-lime-500"}`}>+{challenge.points}</span>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-1">PTS Reward</p>
                                </div>
                            </div>
                            
                            <h4 className="text-2xl font-black text-gray-800 mb-10 leading-tight">{challenge.question}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {challenge.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(challenge.id, idx)}
                                        disabled={submitting || answeredIds.has(challenge.id) || isUpcoming}
                                        className={`w-full p-6 rounded-2xl font-black text-base transition-all text-right flex items-center justify-between group/btn border-2 ${
                                            answeredIds.has(challenge.id)
                                                ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                                                : isUpcoming
                                                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50"
                                                    : "bg-white text-gray-700 border-gray-100 hover:border-lime-500 hover:bg-lime-50/30 hover:shadow-xl hover:shadow-lime-100"
                                        }`}
                                    >
                                        <span>{option}</span>
                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                            answeredIds.has(challenge.id) ? "border-gray-200" : "border-gray-100 group-hover/btn:border-lime-500"
                                        }`}>
                                            <div className="w-3 h-3 rounded-full bg-lime-500 opacity-0 group-hover/btn:opacity-100"></div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {start && isUpcoming && (
                                <div className="mt-8 p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 flex items-center justify-center gap-4">
                                    <span className="text-2xl">📅</span>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1 leading-none">Countdown Started</p>
                                        <p className="text-sm font-black text-blue-600">المسابقة ستبدأ في {formatDateTime(start)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ChallengesStudent;
