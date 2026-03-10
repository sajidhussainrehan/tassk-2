import { useRef, useState } from "react";

function LeaderboardTicker({ students }) {
  const tickerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Sort students by points descending
  const sortedStudents = [...students].sort((a, b) => b.points - a.points);
  const top3 = sortedStudents.slice(0, 3);
  const restStudents = sortedStudents.slice(3);

  // Mouse/Touch handlers for dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - tickerRef.current.offsetLeft);
    setScrollLeft(tickerRef.current.scrollLeft);
    tickerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (tickerRef.current) {
      tickerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - tickerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    tickerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - tickerRef.current.offsetLeft);
    setScrollLeft(tickerRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - tickerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    tickerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Get rank badge style
  const getRankStyle = (rank) => {
    if (rank <= 5) return "bg-gradient-to-r from-yellow-400 to-orange-400 text-white";
    if (rank <= 10) return "bg-gradient-to-r from-blue-400 to-cyan-400 text-white";
    if (rank <= 15) return "bg-gradient-to-r from-purple-400 to-pink-400 text-white";
    return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
  };

  if (students.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-2xl shadow-xl overflow-hidden mb-8" dir="rtl">
      {/* Top 3 Podium in Center */}
      <div className="bg-gradient-to-b from-yellow-600 to-orange-600 py-4 px-6">
        <h3 className="text-center text-white font-bold text-xl mb-4 flex items-center justify-center gap-2">
          <span className="text-2xl">🏆</span>
          <span>المتصدرون</span>
          <span className="text-2xl">🏆</span>
        </h3>
        
        <div className="flex items-end justify-center gap-4">
          {/* Second Place */}
          {top3[1] && (
            <div className="flex flex-col items-center transform hover:scale-105 transition-transform">
              <div className="relative">
                {top3[1].image_url ? (
                  <img
                    src={top3[1].image_url}
                    alt={top3[1].name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-gray-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-2xl font-bold border-4 border-gray-400">
                    {top3[1].name.charAt(0)}
                  </div>
                )}
                <span className="absolute -top-2 -right-2 text-3xl">🥈</span>
              </div>
              <div className="bg-gray-300 text-gray-800 px-3 py-1 rounded-full mt-2 font-bold text-sm">
                {top3[1].points}
              </div>
              <div className="text-white text-sm font-semibold mt-1 max-w-20 truncate text-center">
                {top3[1].name.split(' ')[0]}
              </div>
              <div className="bg-gray-400 w-20 h-16 rounded-t-lg mt-2 flex items-center justify-center text-white font-bold text-2xl">
                2
              </div>
            </div>
          )}

          {/* First Place */}
          {top3[0] && (
            <div className="flex flex-col items-center transform hover:scale-105 transition-transform -mt-4">
              <div className="relative">
                {top3[0].image_url ? (
                  <img
                    src={top3[0].image_url}
                    alt={top3[0].name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 text-3xl font-bold border-4 border-yellow-500">
                    {top3[0].name.charAt(0)}
                  </div>
                )}
                <span className="absolute -top-3 -right-3 text-4xl">🥇</span>
              </div>
              <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full mt-2 font-bold">
                {top3[0].points}
              </div>
              <div className="text-white font-bold mt-1 max-w-24 truncate text-center">
                {top3[0].name.split(' ')[0]}
              </div>
              <div className="bg-yellow-500 w-24 h-20 rounded-t-lg mt-2 flex items-center justify-center text-white font-bold text-3xl">
                1
              </div>
            </div>
          )}

          {/* Third Place */}
          {top3[2] && (
            <div className="flex flex-col items-center transform hover:scale-105 transition-transform">
              <div className="relative">
                {top3[2].image_url ? (
                  <img
                    src={top3[2].image_url}
                    alt={top3[2].name}
                    className="w-14 h-14 rounded-full object-cover border-4 border-orange-400"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-orange-400 flex items-center justify-center text-orange-900 text-xl font-bold border-4 border-orange-500">
                    {top3[2].name.charAt(0)}
                  </div>
                )}
                <span className="absolute -top-2 -right-2 text-2xl">🥉</span>
              </div>
              <div className="bg-orange-400 text-orange-900 px-3 py-1 rounded-full mt-2 font-bold text-sm">
                {top3[2].points}
              </div>
              <div className="text-white text-sm font-semibold mt-1 max-w-20 truncate text-center">
                {top3[2].name.split(' ')[0]}
              </div>
              <div className="bg-orange-500 w-20 h-12 rounded-t-lg mt-2 flex items-center justify-center text-white font-bold text-2xl">
                3
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Draggable Scrolling Ticker */}
      {restStudents.length > 0 && (
        <div className="bg-white/10 backdrop-blur py-3 px-2">
          <div 
            ref={tickerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide cursor-grab select-none"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleMouseUp}
            onTouchMove={handleTouchMove}
          >
            {restStudents.map((student) => {
              const rank = sortedStudents.indexOf(student) + 1;
              return (
                <div 
                  key={student.id}
                  className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-3 flex-shrink-0 transition-all"
                >
                  {/* Rank Badge - Beautiful Circle */}
                  <div className={`w-10 h-10 rounded-full ${getRankStyle(rank)} flex items-center justify-center font-bold text-lg shadow-lg`}>
                    {rank}
                  </div>
                  
                  {/* Student Image */}
                  {student.image_url ? (
                    <img
                      src={student.image_url}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0)}
                    </div>
                  )}
                  
                  {/* Student Name */}
                  <span className="text-white font-semibold whitespace-nowrap">
                    {student.name.split(' ').slice(0, 2).join(' ')}
                  </span>
                  
                  {/* Points Badge */}
                  <span className="bg-white text-orange-600 px-3 py-1 rounded-full font-bold text-sm shadow">
                    {student.points}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Scroll Hint */}
          <div className="text-center mt-2">
            <span className="text-white/60 text-xs">← اسحب للتصفح →</span>
          </div>
        </div>
      )}

      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default LeaderboardTicker;
