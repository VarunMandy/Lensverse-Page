import React, { useState, useEffect } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Instagram, Mail, Menu } from 'lucide-react';

// Gallery data with categories
const galleryData = [
  { id: 1, url: "Photos/1.jpg", category: "Fashion", title: "Neon Editorial" },
  { id: 2, url: "Photos/2.jpg", category: "Events", title: "Live Strings" },
  { id: 3, url: "Photos/3.jpg", category: "Portraits", title: "Raw Vocals" },
  { id: 4, url: "Photos/4.jpg", category: "Events", title: "Guitar Detail" },
  { id: 5, url: "Photos/5.jpg", category: "Events", title: "Stage Light" },
  { id: 6, url: "Photos/6.jpg", category: "Portraits", title: "The Crooner" },
  { id: 7, url: "Photos/7.jpg", category: "Events", title: "Classical Grace" },
  { id: 8, url: "Photos/8.jpg", category: "Portraits", title: "Dancer's Gaze" },
  { id: 9, url: "Photos/9.jpg", category: "Events", title: "Red Glow" },
  { id: 10, url: "Photos/10.jpg", category: "Events", title: "In The Moment" },
  { id: 11, url: "Photos/11.jpg", category: "Events", title: "Joyful Note" },
  { id: 12, url: "Photos/12.jpg", category: "Events", title: "Rhythm & Soul" },
  { id: 13, url: "Photos/13.jpg", category: "Portraits", title: "Golden Voice" },
  { id: 14, url: "Photos/14.jpg", category: "Fashion", title: "Amber Silhouette" },
  { id: 15, url: "Photos/15.jpg", category: "Landscape", title: "Sunset Shore" },
  { id: 16, url: "Photos/16.jpg", category: "Landscape", title: "Sky High" },
  { id: 17, url: "Photos/17.jpg", category: "Landscape", title: "Tropical Canal" },
  { id: 18, url: "Photos/18.jpg", category: "Portraits", title: "Good Boy" },
  { id: 19, url: "Photos/19.jpg", category: "Landscape", title: "The Lighthouse" },
  { id: 20, url: "Photos/20.jpg", category: "Events", title: "Paisley Groove" },
  { id: 21, url: "Photos/21.jpg", category: "Landscape", title: "Temple Gopuram" },
  { id: 22, url: "Photos/22.jpg", category: "Fashion", title: "Pink Wings" },
  { id: 23, url: "Photos/23.jpg", category: "Fashion", title: "Royal Crown" },
  { id: 24, url: "Photos/24.jpg", category: "Fashion", title: "Golden Fairy" },
  { id: 25, url: "Photos/25.jpg", category: "Portraits", title: "Wings of Light" },
  { id: 26, url: "Photos/26.jpg", category: "Fashion", title: "Neon Bloom" },
  { id: 27, url: "Photos/27.jpg", category: "Fashion", title: "Emerald Flame" },
  { id: 28, url: "Photos/28.jpg", category: "Fashion", title: "Desert Prince" },
  { id: 29, url: "Photos/29.jpg", category: "Portraits", title: "Purple Halo" },
  { id: 30, url: "Photos/30.jpg", category: "Fashion", title: "Blue Blossom" },
  { id: 31, url: "Photos/31.jpg", category: "Fashion", title: "Lotus Glow" },
  { id: 32, url: "Photos/32.jpg", category: "Fashion", title: "Crimson Fire" },
  { id: 33, url: "Photos/33.jpg", category: "Fashion", title: "Golden Lotus" },
  { id: 34, url: "Photos/34.jpg", category: "Portraits", title: "Duo in Motion" },
  { id: 35, url: "Photos/35.jpg", category: "Fashion", title: "Violet Duo" },
  { id: 36, url: "Photos/36.jpg", category: "Fashion", title: "Scarlet Dance" },
  { id: 37, url: "Photos/37.jpg", category: "Street", title: "Spiral Descent" },
  { id: 38, url: "Photos/38.jpg", category: "Landscape", title: "Still Waters" },
  { id: 39, url: "Photos/39.jpg", category: "Street", title: "Spring Bricks" },
  { id: 40, url: "Photos/40.jpg", category: "Landscape", title: "Golden Dome" },
  { id: 41, url: "Photos/41.jpg", category: "Landscape", title: "Glass & Sky" },
  { id: 42, url: "Photos/42.jpg", category: "Street", title: "Grand Doors" },
  { id: 43, url: "Photos/43.jpg", category: "Landscape", title: "Night Tower" },
  { id: 44, url: "Photos/44.jpg", category: "Street", title: "Rapid Service" },
  { id: 45, url: "Photos/45.jpg", category: "Street", title: "Doorway Visitor" },  
  { id: 46, url: "Photos/46.jpg", category: "Portraits", title: "Motion Blur" },
  { id: 47, url: "Photos/47.jpg", category: "Portraits", title: "Autumn Friend" },
  { id: 48, url: "Photos/48.jpg", category: "Landscape", title: "Lady Liberty" },
  { id: 49, url: "Photos/49.jpg", category: "Landscape", title: "City Skyline" },
  { id: 50, url: "Photos/50.jpg", category: "Portraits", title: "Snow Watch" },
  { id: 51, url: "Photos/51.jpg", category: "Street", title: "DUMBO View" },
  { id: 52, url: "Photos/52.jpg", category: "Street", title: "Night Glow" }
];

const categories = ["All", "Portraits", "Landscape", "Events", "Fashion", "Street"];

// Navigation Component
const Navigation = ({ currentPage, setCurrentPage, isScrolled }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${
      currentPage !== 'home'
        ? 'bg-slate-900/95 backdrop-blur-md shadow-lg'
        : isScrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setCurrentPage('home')}
            className="text-2xl font-light tracking-[0.3em] text-white hover:opacity-70 transition-opacity"
          >
            LENSVERSE
          </button>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-12">
            {['HOME', 'PORTFOLIO', 'ABOUT', 'CONTACT'].map((item) => (
              <button
                key={item}
                onClick={() => setCurrentPage(item.toLowerCase())}
                className={`text-sm tracking-[0.2em] transition-all duration-300 ${
                  currentPage === item.toLowerCase()
                    ? 'text-white border-b-2 border-white pb-1'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-6 pb-4 flex flex-col gap-4">
            {['HOME', 'PORTFOLIO', 'ABOUT', 'CONTACT'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setCurrentPage(item.toLowerCase());
                  setMobileMenuOpen(false);
                }}
                className={`text-sm tracking-[0.2em] text-left transition-all duration-300 ${
                  currentPage === item.toLowerCase() ? 'text-white' : 'text-gray-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

// Home Page Component
const HomePage = ({ setCurrentPage }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className={`text-center max-w-4xl transition-all duration-1000 transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <p className="text-gray-300 text-sm tracking-[0.4em] mb-6 animate-fade-in">
            VISUAL STORYTELLER
          </p>
          
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-extralight text-white mb-8 tracking-tight">
            Lensverse
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 font-light mb-12 leading-relaxed max-w-2xl mx-auto">
            Capturing moments that tell stories, one frame at a time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button
              onClick={() => setCurrentPage('portfolio')}
              className="group px-10 py-4 bg-white text-slate-900 rounded-full text-sm tracking-[0.2em] font-medium hover:bg-gray-100 transition-all duration-300 flex items-center gap-3 shadow-2xl"
            >
              VIEW PORTFOLIO
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => setCurrentPage('contact')}
              className="px-10 py-4 border-2 border-white text-white rounded-full text-sm tracking-[0.2em] font-medium hover:bg-white hover:text-slate-900 transition-all duration-300 shadow-2xl"
            >
              CONTACT ME
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

// Lightbox Component
const Lightbox = ({ image, onClose, onNext, onPrev }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10"
      >
        <X size={32} />
      </button>

      <button
        onClick={onPrev}
        className="absolute left-6 text-white hover:text-gray-300 transition-colors z-10"
      >
        <ChevronLeft size={48} />
      </button>

      <button
        onClick={onNext}
        className="absolute right-6 text-white hover:text-gray-300 transition-colors z-10"
      >
        <ChevronRight size={48} />
      </button>

      <img
        src={image.url}
        alt={image.title}
        className="max-h-[90vh] max-w-[90vw] object-contain"
      />

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white text-center">
        <p className="text-lg font-light">{image.title}</p>
        <p className="text-sm text-gray-400 mt-1">{image.category}</p>
      </div>
    </div>
  );
};

// Portfolio Page Component
const PortfolioPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const filteredImages = selectedCategory === "All"
    ? galleryData
    : galleryData.filter(img => img.category === selectedCategory);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleNext = () => {
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % filteredImages.length;
    setSelectedImage(filteredImages[nextIndex]);
  };

  const handlePrev = () => {
    const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + filteredImages.length) % filteredImages.length;
    setSelectedImage(filteredImages[prevIndex]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <p className="text-gray-500 text-sm tracking-[0.3em] mb-4">SELECTED WORK</p>
          <h1 className="text-5xl md:text-6xl font-light text-slate-900 mb-12">Featured Gallery</h1>

          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm tracking-wider transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid - Masonry */}
        <div className="max-w-7xl mx-auto masonry-grid">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-all duration-500 hover:shadow-2xl animate-fade-in"
              style={{ animationDelay: `${index * 100}ms`, breakInside: 'avoid', marginBottom: '1.5rem' }}
              onClick={() => handleImageClick(image)}
            >
              <div className="overflow-hidden">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full block object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-lg font-light">{image.title}</p>
                  <p className="text-sm text-gray-300 mt-1">{image.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <Lightbox
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </div>
  );
};

// About Page Component
const AboutPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className={`grid md:grid-cols-2 gap-16 items-center transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {/* Profile Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&h=800&fit=crop"
                alt="Photographer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Bio Content */}
          <div>
            <p className="text-gray-500 text-sm tracking-[0.3em] mb-4">ABOUT ME</p>
            <h1 className="text-5xl font-light text-slate-900 mb-6">Photographer</h1>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Hey, I'm Varun Mandepudi — a photographer based in Boston, Massachusetts. 
                I love finding beauty in both the ordinary and the unexpected, chasing light 
                and capturing moments that feel honest and alive.
              </p>
              
              <p>
                From quiet landscapes at golden hour to the raw energy of street life, 
                fashion editorials, and event photography — every frame is a story worth 
                telling. I'm always open to collaborations and creative projects — let's 
                make something together.
              </p>
            </div>

            {/* Skills */}
            <div className="mt-10">
              <h3 className="text-xl font-light text-slate-900 mb-4">Expertise</h3>
              <div className="flex flex-wrap gap-3">
                {['Portrait Photography', 'Landscape', 'Street Photography', 'Fashion', 
                  'Event Photography', 'Photo Editing'].map((skill) => (
                  <span
                    key={skill}
                    className="px-4 py-2 bg-gray-100 text-slate-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="mt-10">
              <h3 className="text-xl font-light text-slate-900 mb-4">Experience</h3>
              <div className="space-y-3 text-gray-700">
                <p>📸 Portrait, Landscape & Street Photography</p>
                <p>🌆 Based in Boston, Massachusetts</p>
                <p>🎨 Skilled in Lightroom & Photoshop post-processing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Contact Page Component
const ContactPage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '16f0726e-09d2-4be5-9f9b-3e33b289dbee',
          subject: 'New Contact from Lensverse Portfolio',
          from_name: 'Lensverse Portfolio',
          name: formData.name,
          email: formData.email,
          message: formData.message
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
        setFormData({ name: '', email: '', message: '' });
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      alert('Something went wrong. Please try again.');
    }

    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h1 className="text-5xl md:text-6xl font-light text-slate-900 mb-6">
            Have a project in mind?
          </h1>
          <p className="text-xl text-gray-600 font-light">
            I'd love to hear about your vision. Let's create something beautiful together.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  required
                  rows="5"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Tell me about your project..."
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full px-8 py-4 bg-slate-900 text-white rounded-full text-sm tracking-[0.2em] font-medium hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg disabled:opacity-60"
              >
                {sending ? 'SENDING...' : 'GET IN TOUCH'}
                {!sending && <ChevronRight size={18} />}
              </button>

              {submitted && (
                <p className="text-green-600 text-center animate-fade-in">
                  Thank you! I'll get back to you soon.
                </p>
              )}
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-light text-slate-900 mb-4">Let's Connect</h3>
              <p className="text-gray-600 leading-relaxed">
                Whether you're planning a wedding, need professional portraits, or have a creative 
                project in mind, I'm here to bring your vision to life.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-medium text-slate-900 mb-4">Follow My Work</h4>
              <div className="flex gap-4">
                <a
                  href="https://www.instagram.com/_.lensverse_?igsh=MWVldmV1Z3M4MTRxYg=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-lg"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="mailto:lensverse1@gmail.com"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-lg"
                >
                  <Mail size={20} />
                </a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h4 className="text-lg font-medium text-slate-900 mb-3">Location</h4>
              <p className="text-gray-600">Based in Boston, Massachusetts</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// Footer Component
const Footer = () => {
  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <h3 className="text-3xl font-light tracking-[0.3em] mb-6">LENSVERSE PHOTOGRAPHY</h3>
          
          <div className="flex justify-center gap-6 mb-8">
            <a href="https://www.instagram.com/_.lensverse_?igsh=MWVldmV1Z3M4MTRxYg==" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
              <Instagram size={24} />
            </a>
            <a href="mailto:lensverse1@gmail.com" className="hover:opacity-70 transition-opacity">
              <Mail size={24} />
            </a>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400 text-sm tracking-wider">
              © 2026 ALL RIGHTS RESERVED
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main App Component
export default function PhotographyPortfolio() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  return (
    <div className="font-sans antialiased">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} isScrolled={isScrolled} />
      
      {currentPage === 'home' && <HomePage setCurrentPage={setCurrentPage} />}
      {currentPage === 'portfolio' && <PortfolioPage />}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'contact' && <ContactPage />}
      
      <Footer />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@200;300;400;500;600&display=swap');
        
        * {
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        h1, h2, h3 {
          font-family: 'Cormorant Garamond', serif;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .masonry-grid {
          column-count: 3;
          column-gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .masonry-grid {
            column-count: 1;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .masonry-grid {
            column-count: 2;
          }
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
