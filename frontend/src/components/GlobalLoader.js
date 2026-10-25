import { useState, useEffect } from "react";
import axios from "axios";

export const GlobalLoader = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Several requests often run in parallel: count them and keep a single timer,
        // so the bar only finishes when the last one completes.
        let pending = 0;
        let timer = null;
        let hideTimeout = null;

        const start = () => {
            pending += 1;
            if (pending > 1) return;
            clearTimeout(hideTimeout);
            setLoading(true);
            setProgress(15);
            // Advance progress slowly
            timer = setInterval(() => {
                setProgress((prev) => (prev >= 90 ? 90 : prev + 2));
            }, 300);
        };

        const finish = () => {
            pending = Math.max(0, pending - 1);
            if (pending > 0) return;
            clearInterval(timer);
            timer = null;
            setProgress(100);
            hideTimeout = setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 400);
        };

        const requestInterceptor = axios.interceptors.request.use((config) => {
            start();
            return config;
        });

        const responseInterceptor = axios.interceptors.response.use(
            (response) => {
                finish();
                return response;
            },
            (error) => {
                finish();
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
            clearInterval(timer);
            clearTimeout(hideTimeout);
        };
    }, []);

    if (!loading && progress === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-all duration-300">
            {/* Smooth top progress bar */}
            <div 
                className="h-[4px] bg-gradient-to-r from-lime-400 via-green-500 to-emerald-600 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(163,230,53,0.8)]"
                style={{ width: `${progress}%` }}
            />
            
            {/* Subtle center spinner for long initial loads */}
            {loading && progress < 40 && (
                <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center animate-fadeIn pointer-events-auto">
                    <div className="relative group scale-150">
                        <div className="w-12 h-12 border-4 border-lime-200 border-t-lime-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl animate-pulse">🌟</span>
                        </div>
                        <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold text-lime-800 tracking-widest animate-pulse">جاري التحميل...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalLoader;
