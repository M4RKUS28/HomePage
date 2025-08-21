import { NextResponse } from 'next/server';

const projects = [
  {
    id: 1,
    title: "E-Commerce Platform",
    description: "A full-stack e-commerce solution with React frontend and FastAPI backend",
    technologies: ["React", "Next.js", "FastAPI", "PostgreSQL", "Tailwind CSS"],
    category: "Full Stack",
    status: "Completed",
    image: "/placeholder-project.png",
    createdAt: "2024-01-15",
    updatedAt: "2024-03-20"
  },
  {
    id: 2,
    title: "Task Management App",
    description: "Collaborative task management application with real-time updates",
    technologies: ["React", "Node.js", "Socket.io", "MongoDB", "Express"],
    category: "Web App",
    status: "Completed",
    image: "/placeholder-project.png",
    createdAt: "2024-02-10",
    updatedAt: "2024-04-15"
  },
  {
    id: 3,
    title: "Restaurant Booking System",
    description: "Online reservation system for restaurants with admin dashboard",
    technologies: ["Next.js", "Python", "FastAPI", "PostgreSQL", "Redis"],
    category: "Full Stack",
    status: "In Progress",
    image: "/placeholder-project.png",
    createdAt: "2024-03-01",
    updatedAt: "2024-08-20"
  },
  {
    id: 4,
    title: "Portfolio Website",
    description: "Modern portfolio website for a creative agency",
    technologies: ["React", "Next.js", "Tailwind CSS", "Framer Motion"],
    category: "Frontend",
    status: "Completed",
    image: "/placeholder-project.png",
    createdAt: "2024-01-20",
    updatedAt: "2024-02-28"
  },
  {
    id: 5,
    title: "API Gateway Service",
    description: "Microservices API gateway with authentication and rate limiting",
    technologies: ["Python", "FastAPI", "Redis", "PostgreSQL", "Docker"],
    category: "Backend",
    status: "Completed",
    image: "/placeholder-project.png",
    createdAt: "2024-04-01",
    updatedAt: "2024-06-10"
  },
  {
    id: 6,
    title: "Real Estate Platform",
    description: "Property listing and management platform with advanced search",
    technologies: ["React", "TypeScript", "Node.js", "MongoDB", "AWS"],
    category: "Full Stack",
    status: "In Progress",
    image: "/placeholder-project.png",
    createdAt: "2024-05-15",
    updatedAt: "2024-08-21"
  }
];

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);
    const project = projects.find(p => p.id === id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Project API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
