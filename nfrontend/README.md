# M4RKUS Portfolio Website

A modern, responsive portfolio website built with Next.js 15, React 19, and Tailwind CSS.

## 🚀 Features

- **Modern Tech Stack**: Next.js 15, React 19, Tailwind CSS
- **Responsive Design**: Mobile-first approach with modern UI components
- **Page Navigation**: Smooth page transitions with loading states
- **API Routes**: Built-in API endpoints for dynamic content
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Component-Based**: Modular and reusable components

## 📁 Project Structure

```
src/
├── app/
│   ├── about/page.js           # About page
│   ├── contact/page.js         # Contact form page
│   ├── portfolio/page.js       # Portfolio showcase
│   ├── services/page.js        # Services overview
│   ├── api/
│   │   ├── contact/route.js    # Contact form API
│   │   ├── projects/route.js   # Projects API
│   │   └── skills/route.js     # Skills API
│   ├── globals.css             # Global styles
│   ├── layout.js              # Root layout with header/footer
│   ├── loading.js             # Loading component
│   ├── not-found.js           # 404 page
│   └── page.js                # Home page
├── components/
│   ├── Header.jsx             # Navigation header
│   ├── Footer.jsx             # Site footer
│   └── LoadingSpinner.jsx     # Loading spinner component
└── contexts/
    └── LoadingContext.jsx     # Loading state management
```

## 🎨 Pages

1. **Home** (`/`) - Hero section with service overview
2. **About** (`/about`) - Personal story and skills
3. **Services** (`/services`) - Service offerings and process
4. **Portfolio** (`/portfolio`) - Project showcase with filtering
5. **Contact** (`/contact`) - Contact form with validation

## 🔧 API Endpoints

- `GET /api/projects` - Fetch all projects with filtering
- `GET /api/projects/[id]` - Fetch single project
- `GET /api/skills` - Fetch skills grouped by category
- `POST /api/contact` - Submit contact form

## 🚦 Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📱 Responsive Design

The website is fully responsive with breakpoints:
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

## 🎯 Key Components

### Header
- Responsive navigation menu
- Mobile hamburger menu
- Active page highlighting

### Footer
- Social media links
- Quick navigation
- Contact information

### Loading System
- Context-based loading state
- Page transition animations
- Spinner component

### Form Handling
- Client-side validation
- API integration
- Error handling
- Success feedback

## 🔄 Development Workflow

1. **Pages**: Add new pages in `/app/[page-name]/page.js`
2. **Components**: Create reusable components in `/components/`
3. **API Routes**: Add endpoints in `/app/api/[endpoint]/route.js`
4. **Styling**: Use Tailwind CSS classes for styling

## 📦 Built With

- **[Next.js 15](https://nextjs.org/)** - React framework
- **[React 19](https://react.dev/)** - UI library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[ESLint](https://eslint.org/)** - Code linting

## 🚀 Deployment

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## 📄 License

This project is created for M4RKUS portfolio purposes.
