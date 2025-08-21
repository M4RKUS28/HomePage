'use client';

import Image from 'next/image';

export default function Portfolio() {
  const projects = [
    {
      id: 1,
      title: "E-Commerce Platform",
      description: "A full-stack e-commerce solution with React frontend and FastAPI backend",
      technologies: ["React", "Next.js", "FastAPI", "PostgreSQL", "Tailwind CSS"],
      image: "/placeholder-project.svg",
      category: "Full Stack",
      status: "Completed"
    },
    {
      id: 2,
      title: "Task Management App",
      description: "Collaborative task management application with real-time updates",
      technologies: ["React", "Node.js", "Socket.io", "MongoDB", "Express"],
      image: "/placeholder-project.svg",
      category: "Web App",
      status: "Completed"
    },
    {
      id: 3,
      title: "Restaurant Booking System",
      description: "Online reservation system for restaurants with admin dashboard",
      technologies: ["Next.js", "Python", "FastAPI", "PostgreSQL", "Redis"],
      image: "/placeholder-project.svg",
      category: "Full Stack",
      status: "In Progress"
    },
    {
      id: 4,
      title: "Portfolio Website",
      description: "Modern portfolio website for a creative agency",
      technologies: ["React", "Next.js", "Tailwind CSS", "Framer Motion"],
      image: "/placeholder-project.svg",
      category: "Frontend",
      status: "Completed"
    },
    {
      id: 5,
      title: "API Gateway Service",
      description: "Microservices API gateway with authentication and rate limiting",
      technologies: ["Python", "FastAPI", "Redis", "PostgreSQL", "Docker"],
      image: "/placeholder-project.svg",
      category: "Backend",
      status: "Completed"
    },
    {
      id: 6,
      title: "Real Estate Platform",
      description: "Property listing and management platform with advanced search",
      technologies: ["React", "TypeScript", "Node.js", "MongoDB", "AWS"],
      image: "/placeholder-project.svg",
      category: "Full Stack",
      status: "In Progress"
    }
  ];

  const categories = ["All", "Full Stack", "Frontend", "Backend", "Web App"];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            My Portfolio
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A showcase of my recent projects and the technologies I&apos;ve worked with
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category, index) => (
            <button
              key={`category-${category}-${index}`}
              className="px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gray-200">
                <Image
                  src="/placeholder-project.svg"
                  alt={project.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.status === 'Completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {project.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {project.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skills Section */}
        <div className="bg-gray-50 rounded-lg p-8 mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Technologies I Work With
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              "React", "Next.js", "TypeScript", "Python", "FastAPI", "Node.js",
              "PostgreSQL", "MongoDB", "Tailwind CSS", "Docker", "AWS", "Git"
            ].map((tech) => (
              <div key={tech} className="text-center">
                <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🔧</span>
                </div>
                <span className="text-sm text-gray-700 font-medium">{tech}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-600 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">
            Interested in Working Together?
          </h2>
          <p className="mb-6">
            I&apos;d love to discuss your project and see how I can help
          </p>
          <a
            href="/contact"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Let&apos;s Talk
          </a>
        </div>
      </div>
    </div>
  );
}
