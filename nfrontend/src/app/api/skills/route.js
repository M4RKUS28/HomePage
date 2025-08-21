import { NextResponse } from 'next/server';

const skills = [
  {
    id: 1,
    name: "React",
    category: "Frontend",
    level: "Expert",
    experience: "5+ years",
    description: "Modern React development with hooks, context, and performance optimization"
  },
  {
    id: 2,
    name: "Next.js",
    category: "Frontend",
    level: "Expert",
    experience: "3+ years",
    description: "Full-stack React framework with SSR, SSG, and API routes"
  },
  {
    id: 3,
    name: "TypeScript",
    category: "Language",
    level: "Advanced",
    experience: "4+ years",
    description: "Type-safe JavaScript development for scalable applications"
  },
  {
    id: 4,
    name: "Python",
    category: "Backend",
    level: "Expert",
    experience: "6+ years",
    description: "Backend development, automation, and data processing"
  },
  {
    id: 5,
    name: "FastAPI",
    category: "Backend",
    level: "Expert",
    experience: "3+ years",
    description: "High-performance Python web framework for building APIs"
  },
  {
    id: 6,
    name: "PostgreSQL",
    category: "Database",
    level: "Advanced",
    experience: "4+ years",
    description: "Relational database design, optimization, and administration"
  },
  {
    id: 7,
    name: "MongoDB",
    category: "Database",
    level: "Intermediate",
    experience: "2+ years",
    description: "NoSQL database for flexible, document-based data storage"
  },
  {
    id: 8,
    name: "Docker",
    category: "DevOps",
    level: "Advanced",
    experience: "3+ years",
    description: "Containerization and orchestration for scalable deployments"
  },
  {
    id: 9,
    name: "AWS",
    category: "Cloud",
    level: "Intermediate",
    experience: "2+ years",
    description: "Cloud infrastructure and services deployment"
  },
  {
    id: 10,
    name: "Tailwind CSS",
    category: "Frontend",
    level: "Advanced",
    experience: "3+ years",
    description: "Utility-first CSS framework for rapid UI development"
  }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');

    let filteredSkills = [...skills];

    // Filter by category
    if (category) {
      filteredSkills = filteredSkills.filter(
        skill => skill.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by level
    if (level) {
      filteredSkills = filteredSkills.filter(
        skill => skill.level.toLowerCase() === level.toLowerCase()
      );
    }

    // Group skills by category for organized response
    const groupedSkills = filteredSkills.reduce((acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = [];
      }
      acc[skill.category].push(skill);
      return acc;
    }, {});

    return NextResponse.json({
      skills: filteredSkills,
      groupedSkills,
      categories: [...new Set(skills.map(s => s.category))],
      levels: [...new Set(skills.map(s => s.level))]
    });
  } catch (error) {
    console.error('Skills API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
