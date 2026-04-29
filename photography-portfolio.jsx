import React, { useState, useEffect } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, Instagram, Twitter, Globe, Mail, Menu } from 'lucide-react';

// Gallery data with categories
const galleryData = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop",
    category: "Portraits",
    title: "Urban Portrait"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1000&fit=crop",
    category: "Events",
    title: "Wedding Moment"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    category: "Landscape",
    title: "Mountain Vista"
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1000&fit=crop",
    category: "Portraits",
    title: "Studio Portrait"
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop",
    category: "Street",
    title: "City Lights"
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop",
    category: "Landscape",
    title: "Forest Path"
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=800&h=1000&fit=crop",
    category: "Events",
    title: "Celebration"
  },
  {
    id: 8,
    url: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&h=1000&fit=crop",
    category: "Portraits",
    title: "Natural Light"
  },
  {
    id: 9,
    url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop",
    category: "Landscape",
    title: "Golden Hour"
  },
  {
    id: 10,
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1000&fit=crop",
    category: "Portraits",
    title: "Expression"
  },
  {
    id: 11,
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop",
    category: "Street",
    title: "Urban Scene"
  },
  {
    id: 12,
    url: "https://images.unsplash.com/photo-1519167758481-83f29da1a789?w=800&h=1000&fit=crop",
    category: "Wildlife",
    title: "Nature's Beauty"
  }
];

const categories = ["All", "Portraits", "Landscape", "Events", "Street", "Wildlife"];

// Navigation Component
const Navigation = ({ currentPage, setCurrentPage, isScrolled }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-500 ${
      isScrolled ? 'bg-slate-900/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
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

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredImages.map((image, index) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer transition-all duration-500 hover:shadow-2xl animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleImageClick(image)}
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-slate-900 rounded-2xl -z-10"></div>
          </div>

          {/* Bio Content */}
          <div>
            <p className="text-gray-500 text-sm tracking-[0.3em] mb-4">ABOUT ME</p>
            <h1 className="text-5xl font-light text-slate-900 mb-6">Visual Storyteller</h1>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                I'm a passionate photographer dedicated to capturing the extraordinary in everyday moments. 
                With over 10 years of experience, I specialize in portrait, landscape, and event photography.
              </p>
              
              <p>
                My approach combines technical precision with artistic vision, creating images that 
                resonate emotionally and stand the test of time. Every photograph tells a unique story, 
                and I'm honored to help preserve these memories.
              </p>
              
              <p>
                Based in the heart of nature's canvas, I draw inspiration from the world around me, 
                constantly seeking new perspectives and pushing creative boundaries.
              </p>
            </div>

            {/* Skills */}
            <div className="mt-10">
              <h3 className="text-xl font-light text-slate-900 mb-4">Expertise</h3>
              <div className="flex flex-wrap gap-3">
                {['Portrait Photography', 'Landscape', 'Event Coverage', 'Studio Lighting', 
                  'Photo Editing', 'Commercial Work'].map((skill) => (
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
                <p>📸 10+ years professional photography</p>
                <p>🏆 Featured in National Geographic, Vogue</p>
                <p>🎓 MFA in Photography, Rhode Island School of Design</p>
                <p>🌍 Work exhibited in 15+ countries worldwide</p>
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

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', message: '' });
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
                className="w-full px-8 py-4 bg-slate-900 text-white rounded-full text-sm tracking-[0.2em] font-medium hover:bg-slate-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
              >
                GET IN TOUCH
                <ChevronRight size={18} />
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
                  href="#"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-lg"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-lg"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-lg"
                >
                  <Globe size={20} />
                </a>
                <a
                  href="#"
                  className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-lg"
                >
                  <Mail size={20} />
                </a>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h4 className="text-lg font-medium text-slate-900 mb-3">Location</h4>
              <p className="text-gray-600">Based in Portland, Oregon</p>
              <p className="text-gray-600 mt-2">Available for travel worldwide</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h4 className="text-lg font-medium text-slate-900 mb-3">Response Time</h4>
              <p className="text-gray-600">I typically respond within 24-48 hours</p>
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
            <a href="#" className="hover:opacity-70 transition-opacity">
              <Instagram size={24} />
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity">
              <Twitter size={24} />
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity">
              <Globe size={24} />
            </a>
            <a href="#" className="hover:opacity-70 transition-opacity">
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

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
