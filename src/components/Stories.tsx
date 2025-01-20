// src/components/Stories.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';

declare global {
  interface Window {
    storyAnimationFrame?: number;
  }
}

interface Story {
  id: string;
  image: string;
  timestamp: number;
}

const Stories: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    // Load stories from localStorage on mount
    const loadStories = () => {
      const savedStories = localStorage.getItem('stories');
      if (savedStories) {
        const parsedStories = JSON.parse(savedStories);
        // Filter out stories older than 24 hours
        const validStories = parsedStories.filter((story: Story) => {
          const age = Date.now() - story.timestamp;
          return age < 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        });
        setStories(validStories);
        // Save filtered stories back to localStorage
        localStorage.setItem('stories', JSON.stringify(validStories));
      }
    };

    loadStories();
    // Check for expired stories every minute
    const interval = setInterval(loadStories, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cleanup al desmontar el componente
    return () => {
      if (window.storyAnimationFrame) {
        cancelAnimationFrame(window.storyAnimationFrame);
      }
    };
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Create image element to check dimensions
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        // Calculate scaled dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > 1080) {
          height = (height * 1080) / width;
          width = 1080;
        }
        if (height > 1920) {
          width = (width * 1920) / height;
          height = 1920;
        }

        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Image = canvas.toDataURL('image/jpeg', 0.8);
          
          const newStory: Story = {
            id: Date.now().toString(),
            image: base64Image,
            timestamp: Date.now(),
          };

          const updatedStories = [...stories, newStory];
          setStories(updatedStories);
          localStorage.setItem('stories', JSON.stringify(updatedStories));
        }

        URL.revokeObjectURL(imageUrl);
      };

      img.src = imageUrl;
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  const showStory = (index: number, shouldAutoplay = true) => {
    // Limpiar cualquier animación previa
    if (window.storyAnimationFrame) {
      cancelAnimationFrame(window.storyAnimationFrame);
    }
  
    setActiveStoryIndex(index);
    setProgress(0);
  
    // Si no debe reproducirse automáticamente, salimos de la función
    if (!shouldAutoplay) return;
    
    const duration = 5000;
    const startTime = Date.now();
  
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
  
      setProgress(newProgress);
  
      if (newProgress < 100) {
        window.storyAnimationFrame = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          if (index < stories.length - 1) {
            showStory(index + 1);
          } else {
            setActiveStoryIndex(-1);
          }
        }, 100);
      }
    };
  
    window.storyAnimationFrame = requestAnimationFrame(animate);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    
    if (Math.abs(deltaX) > 50) { // Minimum swipe distance
      if (deltaX > 0 && activeStoryIndex > 0) {
        // Swipe right - previous story
        showStory(activeStoryIndex - 1);
      } else if (deltaX < 0 && activeStoryIndex < stories.length - 1) {
        // Swipe left - next story
        showStory(activeStoryIndex + 1);
      }
    }
  };

  return (
    <div className="w-full max-w-screen-lg mx-auto p-2 sm:p-4"> {/* Reducir padding en móviles */}
      {/* Stories list */}
      <div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-8 overflow-x-auto pb-4 px-1 sm:px-2 pt-3">
        {/* Add story button - más pequeño en móviles */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 
                     hover:from-purple-600 hover:to-pink-600 transition-all duration-200 
                     flex-shrink-0 shadow-lg hover:scale-105 transform"
        >
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
            <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Story circles - más pequeños en móviles */}
        {stories.map((story, index) => (
          <div key={story.id} className="relative group flex-shrink-0 pt-2 px-1">
            <button
              onClick={() => showStory(index)}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-purple-500 to-pink-500
                         hover:from-purple-600 hover:to-pink-600 transition-all duration-200 
                         transform hover:scale-105 shadow-lg"
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-900">
                <img 
                  src={story.image} 
                  alt="Story preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
            {/* Delete button - ajustado para móviles */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const updatedStories = stories.filter(s => s.id !== story.id);
                setStories(updatedStories);
                localStorage.setItem('stories', JSON.stringify(updatedStories));
              }}
              className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full text-white 
                         flex items-center justify-center opacity-0 group-hover:opacity-100 
                         transition-all duration-200 hover:bg-red-600 shadow-lg z-10"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Vista de historia activa - ajustes para móviles */}
      {activeStoryIndex >= 0 && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 transition-all duration-300"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Barras de progreso - ajustadas para móviles */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex space-x-1 sm:space-x-2 z-10">
            {stories.map((_, index) => (
              <div 
                key={index}
                className="h-1 flex-1 bg-gray-600/50 rounded-full overflow-hidden"
              >
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-200"
                  style={{
                    width: index === activeStoryIndex ? `${progress}%` : 
                           index < activeStoryIndex ? '100%' : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story image */}
          <img
            src={stories[activeStoryIndex].image}
            alt="Story"
            className="w-full h-full object-contain animate-fade-in"
          />

          {/* Botón de cierre - ajustado para móviles */}
          <button
            onClick={() => {
              if (window.storyAnimationFrame) {
                cancelAnimationFrame(window.storyAnimationFrame);
              }
              setActiveStoryIndex(-1);
            }}
            className="absolute top-4 sm:top-8 right-2 sm:right-4 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full 
                       bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 
                       transition-all duration-200 text-sm sm:text-base"
          >
            ✕
          </button>

          {/* Flechas de navegación - ajustadas para móviles */}
          {activeStoryIndex > 0 && (
            <button
              onClick={() => showStory(activeStoryIndex - 1)}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full 
                         bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 
                         transition-all duration-200 text-white"
              aria-label="Previous story"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {activeStoryIndex < stories.length - 1 && (
            <button
              onClick={() => showStory(activeStoryIndex + 1)}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full 
                         bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 
                         transition-all duration-200 text-white"
              aria-label="Next story"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Stories;