import { useState, useEffect } from "react";

// Profesionalne "Barber" slike (Fade, Clean Cut, Tools, Atmosphere)
const images = [
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=80", // Clean Fade Close up
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1920&q=80", // Barber styling hair
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1920&q=80", // Barber shop atmosphere dark
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1920&q=80", // Sharp Beard Trim
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1920&q=80", // Tools / Clippers
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1920&q=80", // Side profile haircut
];

const ImageCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // 4 sekunde rotacija

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="relative w-full h-96 md:h-[600px] overflow-hidden bg-black border-b border-neutral-900">
      {images.map((imgUrl, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 " : "opacity-0 z-0"
          }`}
        >
          <img
            src={imgUrl}
            alt={`Barber slide ${index + 1}`}
            className="w-full h-full object-cover object-center"
          />
          {/* Malo jači overlay za bolji kontrast ako ide tekst preko */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80"></div>
        </div>
      ))}

      {/* Indikatori */}
      <div className="absolute bottom-5 left-1/2  flex -translate-x-1/2 space-x-2">
        {images.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? "bg-white w-8" : "bg-white/40 w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
