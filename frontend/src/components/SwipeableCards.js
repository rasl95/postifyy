import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const SwipeableCards = ({ children, className = '' }) => {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.8;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Left scroll button - visible on hover (desktop) */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2 hover:bg-black/80"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Scrollable container */}
      <div
        ref={containerRef}
        onScroll={checkScrollPosition}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch' 
        }}
      >
        {React.Children.map(children, (child, index) => (
          <div key={index} className="flex-shrink-0 snap-start w-[85%] md:w-[45%] lg:w-auto lg:flex-shrink">
            {child}
          </div>
        ))}
      </div>

      {/* Right scroll button - visible on hover (desktop) */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 hover:bg-black/80"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Scroll indicators for mobile */}
      <div className="flex justify-center gap-1.5 mt-3 md:hidden">
        {React.Children.count(children) > 1 && (
          <>
            <div className={`w-2 h-2 rounded-full transition-colors ${canScrollLeft ? 'bg-gray-600' : 'bg-white/40'}`} />
            <div className={`w-2 h-2 rounded-full transition-colors ${canScrollRight ? 'bg-gray-600' : 'bg-white/40'}`} />
          </>
        )}
      </div>
    </div>
  );
};

// Individual swipeable card component
export const SwipeCard = ({ children, className = '', onSwipeLeft, onSwipeRight }) => {
  const cardRef = useRef(null);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    setOffsetX(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 100;

    if (offsetX > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (offsetX < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }
    setOffsetX(0);
  };

  return (
    <div
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`transition-transform ${className}`}
      style={{
        transform: `translateX(${offsetX}px)`,
        opacity: 1 - Math.abs(offsetX) / 300
      }}
    >
      {children}
    </div>
  );
};
