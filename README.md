# Lensverse Photography Portfolio

A modern, responsive photography portfolio website showcasing elegant design and smooth user experience.

![Lensverse Preview](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop)

## ✨ Features

### Core Features
- **Fully Responsive Design** - Optimized for mobile, tablet, and desktop devices
- **Single Page Application** - Smooth page transitions without reloading
- **Image Gallery** - Grid layout with category filtering
- **Lightbox Viewer** - Full-screen image viewing with keyboard navigation
- **Contact Form** - Professional contact form with validation
- **Smooth Animations** - Fade-in effects, hover states, and transitions
- **Sticky Navigation** - Navigation bar with scroll effects
- **SEO Optimized** - Semantic HTML structure

### Pages
1. **Home** - Full-screen hero with call-to-action buttons
2. **Portfolio** - Filterable gallery with categories (Portraits, Landscape, Events, Street, Wildlife)
3. **About** - Photographer bio, skills, and experience
4. **Contact** - Contact form and social media links

### Interactive Elements
- Category filters for portfolio
- Lightbox with previous/next navigation
- Keyboard shortcuts (ESC to close, arrows to navigate)
- Hover effects on images and buttons
- Form validation and success message
- Smooth scroll animations

## 🚀 Quick Start

### Option 1: HTML Version (No Build Required)

Simply open `index.html` in your browser:

```bash
# Open directly in browser
open index.html

# Or serve with a local server (recommended)
python -m http.server 8000
# Then visit http://localhost:8000
```

### Option 2: React Version

```bash
# Install dependencies
npm install react react-dom lucide-react

# Create a new React app (if needed)
npx create-react-app photography-portfolio
cd photography-portfolio

# Copy photography-portfolio.jsx to src/App.jsx
# Install Tailwind CSS (optional but recommended)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Start development server
npm start
```

## 📁 Project Structure

```
photography-portfolio/
├── index.html                    # Standalone HTML version
├── photography-portfolio.jsx     # React component version
├── README.md                     # This file
└── assets/                       # (Optional) Your custom images
    ├── hero-bg.jpg
    ├── profile.jpg
    └── gallery/
        ├── portrait-1.jpg
        ├── landscape-1.jpg
        └── ...
```

## 🎨 Customization

### Change Colors

Edit the CSS variables in `index.html` or create a Tailwind config:

```css
:root {
    --primary-dark: #0f172a;     /* Main dark color */
    --primary-light: #f8fafc;    /* Light background */
    --accent: #334155;           /* Accent color */
    --text-dark: #1e293b;        /* Text color */
    --text-light: #64748b;       /* Secondary text */
}
```

### Add Your Images

Replace the Unsplash URLs in the gallery data:

**HTML Version:**
```javascript
const galleryData = [
    { 
        id: 1, 
        url: "assets/gallery/portrait-1.jpg", 
        category: "Portraits", 
        title: "Your Photo Title" 
    },
    // ... add more
];
```

**React Version:**
```javascript
const galleryData = [
    {
        id: 1,
        url: "/images/portrait-1.jpg",
        category: "Portraits",
        title: "Your Photo Title"
    },
    // ... add more
];
```

### Modify Text Content

1. **Brand Name**: Change "LENSVERSE" to your brand
2. **Tagline**: Update "Visual Storyteller" to your style
3. **About Section**: Replace bio with your story
4. **Contact Info**: Update location and social links

### Add Categories

Add new categories to the filters:

```javascript
const categories = ["All", "Portraits", "Landscape", "Events", "Street", "Wildlife", "Architecture", "Fashion"];
```

## 🖼️ Image Optimization

### Recommended Image Sizes
- **Hero Background**: 1920x1080px
- **Gallery Images**: 800x1000px (portrait) or 800x600px (landscape)
- **Profile Photo**: 800x800px

### Optimization Tools
- [TinyPNG](https://tinypng.com/) - Compress images
- [Squoosh](https://squoosh.app/) - Advanced compression
- Use WebP format for better performance

### Lazy Loading
Images in the gallery use lazy loading:
```html
<img loading="lazy" src="image.jpg" alt="Description">
```

## 📱 Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Performance Features

- **Lazy Loading** - Images load as they appear in viewport
- **CSS Animations** - Hardware-accelerated transitions
- **Optimized Images** - Responsive image sizes
- **Minimal JavaScript** - Clean, efficient code
- **Fast Load Times** - Under 3 seconds on 3G

## ⌨️ Keyboard Shortcuts

When lightbox is open:
- `ESC` - Close lightbox
- `→` Arrow Right - Next image
- `←` Arrow Left - Previous image

## 🔧 Advanced Customization

### Add Google Analytics

Add before closing `</head>` tag:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Connect Contact Form

The form currently shows a success message. To connect to a backend:

**Option 1: Formspree**
```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
    <!-- form fields -->
</form>
```

**Option 2: EmailJS**
```javascript
emailjs.send("service_id", "template_id", {
    name: formData.name,
    email: formData.email,
    message: formData.message
});
```

### Add Blog Section

Create a new page section:

```html
<section id="blog-page" class="blog page hidden">
    <!-- Blog content -->
</section>
```

## 📦 Dependencies

### HTML Version
- **None!** - Pure HTML, CSS, and JavaScript
- Optional: Local server for development

### React Version
- React 18+
- React DOM
- lucide-react (icons)
- Tailwind CSS (optional, styles included)

## 🚢 Deployment

### Static Hosting (HTML Version)
1. **Netlify**: Drag and drop your folder
2. **Vercel**: `npx vercel`
3. **GitHub Pages**: Push to `gh-pages` branch
4. **Cloudflare Pages**: Connect your repo

### React App
```bash
npm run build
# Deploy the build folder to your hosting service
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Tips

1. **Use high-quality images** - Your portfolio is only as good as your photos
2. **Optimize for mobile** - Most visitors will view on phones
3. **Keep it simple** - Let your photography speak
4. **Fast loading** - Compress images, use lazy loading
5. **Regular updates** - Keep your portfolio current

## 📞 Support

If you need help customizing this template:
- Check the comments in the code
- Modify one section at a time
- Test on different devices
- Use browser DevTools for debugging

## 🎨 Design Inspiration

This portfolio features:
- **Typography**: Cormorant Garamond (headings) + Montserrat (body)
- **Color Scheme**: Slate grays with minimal accent colors
- **Layout**: Grid-based with elegant spacing
- **Animations**: Subtle fade-ins and smooth transitions
- **Philosophy**: Let the photography be the star

## 🔄 Updates

### Version 1.0.0 (February 2026)
- Initial release
- Full responsive design
- Gallery with filtering
- Lightbox functionality
- Contact form
- About section

---

**Made with ❤️ for photographers who want to showcase their work beautifully**

For questions or suggestions, feel free to reach out!
