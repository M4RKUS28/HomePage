# Portfolio Website - Full Stack Application

A modern, responsive portfolio website with admin dashboard, project showcase, and messaging functionality. Built with React for the frontend and FastAPI for the backend.

![Portfolio Website](https://www.m4rkus28.de/)

## ✨ Features

- **🎨 Modern UI/UX** - Beautiful, responsive design with dark/light mode support
- **🔐 User Authentication** - Secure login and registration system
- **📂 Project Showcase** - Display your work with automatic status monitoring
- **📫 Contact System** - Allow visitors to send you messages
- **📊 Admin Dashboard** - Manage projects and messages 
- **📝 Interactive CV** - Showcase your skills and experience
- **⚡ Animation** - Smooth transitions and interactions with Framer Motion

## 🛠️ Tech Stack

### Frontend
- **React** - Component-based UI library
- **React Router** - Navigation and routing
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library
- **Axios** - API requests
- **JWT Decode** - Token handling

### Backend
- **FastAPI** - Modern, high-performance Python web framework
- **SQLAlchemy** - ORM for database interactions
- **Pydantic** - Data validation
- **JWT** - Authentication via JSON Web Tokens
- **Passlib & BCrypt** - Password hashing
- **HTTPX** - Asynchronous HTTP client

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- MySQL or PostgreSQL (configurable)

### Backend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/portfolio-website.git
   cd portfolio-website
   ```

2. Set up Python virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Configure environment variables (create a `.env` file):
   ```
   SECRET_KEY=your_secret_key
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=portfolio
   ```

4. Start the backend server:
   ```bash
   uvicorn src.main:app --reload
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
portfolio-website/
├── backend/
│   ├── src/
│   │   ├── config/       # Application configuration
│   │   ├── db/           # Database connection and models
│   │   ├── models/       # SQLAlchemy models
│   │   ├── routers/      # API endpoints
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   └── requirements.txt  # Python dependencies
│
└── frontend/
    ├── src/
    │   ├── api/          # API integration
    │   ├── assets/       # Static assets 
    │   ├── components/   # React components
    │   ├── contexts/     # Context providers
    │   ├── hooks/        # Custom hooks
    │   ├── layouts/      # Page layouts
    │   └── pages/        # Main application pages
    ├── package.json      # Node.js dependencies
    └── tailwind.config.js # Tailwind CSS configuration
```

## 🔒 Authentication Flow

The application uses JWT-based authentication:
1. User logs in with username and password
2. Backend validates credentials and returns a JWT token
3. Frontend stores the token in localStorage
4. Token is sent with subsequent requests via Authorization header
5. Protected routes check for valid token before granting access

## 📸 Screenshots

### Homepage
![Homepage]()

### Admin Dashboard
![Admin Dashboard]()

### Project Showcase
![Projects]()

## 🔧 Configuration Options

The application includes several configurable options:

### Backend
- Password policy settings in `backend/src/config/settings.py`
- Email notifications in `backend/src/utils/email.py`
- Database connection parameters

### Frontend
- Theme settings in `frontend/src/contexts/ThemeContext.jsx`
- API endpoint configuration in `frontend/src/api/index.js`

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](issues).

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

Your Name - [@yourusername](https://twitter.com/yourusername) - email@example.com

Project Link: []()
