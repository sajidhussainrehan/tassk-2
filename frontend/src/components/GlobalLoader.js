import { useState, useEffect } from "react";
import axios from "axios";

export const GlobalLoader = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let timer;
        
        // Intercept requests
        const requestInterceptor = axios.interceptors.request.use((config) => {
            setLoading(true);
            setProgress(15);
            
            // Advance progress slowly
            timer = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return 90;
                    return prev + 2;
                });
            }, 300);
            
            return config;
        });

        // Intercept responses
        const responseInterceptor = axios.interceptors.response.use(
            (response) => {
                clearInterval(timer);
                setProgress(100);
                setTimeout(() => {
                    setLoading(false);
                    setProgress(0);
                }, 400);
                return response;
            },
            (error) => {
                clearInterval(timer);
                setProgress(100);
                setTimeout(() => {
                    setLoading(false);
                    setProgress(0);
                }, 400);
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
            clearInterval(timer);
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
