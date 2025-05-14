import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, GraduationCap, Code, Award, Users, Zap as SkillIcon } from 'lucide-react'; // Added more icons

const cvData = {
  summary: "A results-driven Full Stack Developer with a passion for creating intuitive and performant web applications. Adept at leveraging modern technologies to build innovative solutions and continuously seeking opportunities to learn and grow in the ever-evolving tech landscape.",
  experience: [
    { id: 1, role: "Senior Full Stack Developer", company: "Innovatech Solutions", period: "2021 - Present", details: "Led a team of 5 developers in designing and implementing scalable microservices for a flagship SaaS product. Spearheaded the adoption of Next.js and GraphQL, improving frontend performance by 30%. Mentored junior developers and contributed to CI/CD pipeline optimization.", icon: Briefcase },
    { id: 2, role: "Software Engineer", company: "Web Wizards LLC", period: "2019 - 2021", details: "Developed and maintained client-facing web applications using React, Node.js, and PostgreSQL. Collaborated in an Agile environment, participating in daily stand-ups, sprint planning, and retrospectives. Implemented RESTful APIs and integrated third-party services.", icon: Briefcase },
  ],
  education: [
    { id: 1, degree: "M.Sc. in Advanced Computer Science", institution: "University of Technology", period: "2017 - 2019", details: "Thesis on 'Machine Learning for Predictive Analytics in E-commerce'. Awarded Distinction.", icon: GraduationCap },
    { id: 2, degree: "B.Sc. in Computer Science", institution: "State University", period: "2014 - 2017", details: "Graduated Summa Cum Laude. President of the Coding Club.", icon: GraduationCap },
  ],
  skills: [
    { name: "JavaScript (ES6+)", level: 95, icon: SkillIcon }, { name: "React & Next.js", level: 90, icon: SkillIcon },
    { name: "Python (FastAPI, Django)", level: 85, icon: SkillIcon }, { name: "Node.js & Express", level: 80, icon: SkillIcon },
    { name: "SQL (PostgreSQL, MySQL)", level: 80, icon: SkillIcon }, { name: "NoSQL (MongoDB)", level: 70, icon: SkillIcon },
    { name: "Docker & Kubernetes", level: 75, icon: SkillIcon }, { name: "AWS/GCP", level: 65, icon: SkillIcon },
    { name: "Tailwind CSS", level: 90, icon: SkillIcon }, { name: "GraphQL", level: 70, icon: SkillIcon },
  ],
  // Add more sections like projects, awards, volunteering
  // projectsHighlight: [ { name: "Project X", description: "..." } ],
  // awards: [ { name: "Best Innovator Award", year: "2022", icon: Award } ],
};

const Section = ({ title, children, icon: IconComponent }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="mb-12"
  >
    <div className="flex items-center mb-6">
      {IconComponent && <IconComponent size={32} className="mr-3 text-primary" />}
      <h3 className="text-3xl font-semibold text-sky-400">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const TimelineItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ItemIcon = item.icon;
  return (
    <motion.div 
      layout 
      className="relative pl-10 py-3 border-l-2 border-gray-700 hover:border-primary transition-colors duration-300 group"
      onClick={() => setIsOpen(!isOpen)}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.5, delay: item.id * 0.1 }}
    >
      <div className="absolute -left-[11px] top-3 w-5 h-5 bg-gray-800 border-2 border-gray-600 group-hover:border-primary rounded-full flex items-center justify-center transition-colors duration-300">
        {ItemIcon && <ItemIcon size={10} className="text-gray-400 group-hover:text-primary transition-colors duration-300" />}
      </div>
      <motion.h4 layout="position" className="text-lg font-medium text-gray-100 cursor-pointer">{item.role || item.degree}</motion.h4>
      <motion.p layout="position" className="text-sm text-primary">{item.company || item.institution} <span className="text-gray-500">| {item.period}</span></motion.p>
      <AnimatePresence>
        {isOpen && item.details && (
          <motion.p 
            layout
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="text-gray-400 text-sm leading-relaxed"
          >
            {item.details}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SkillBar = ({ skill, index }) => (
  <motion.div 
    className="mb-3"
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, amount: 0.8 }}
    transition={{ duration: 0.5, delay: index * 0.05 }}
  >
    <div className="flex justify-between mb-1">
      <div className="flex items-center">
        {skill.icon && <skill.icon size={16} className="mr-2 text-primary" />}
        <span className="text-sm font-medium text-gray-200">{skill.name}</span>
      </div>
      <span className="text-xs font-medium text-gray-400">{skill.level}%</span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <motion.div
        className="bg-gradient-to-r from-primary to-teal-400 h-full rounded-full"
        initial={{ width: 0 }}
        whileInView={{ width: `${skill.level}%` }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 1, delay: 0.2 + (index * 0.05), ease: "circOut" }}
      />
    </div>
  </motion.div>
);

const InteractiveCV = () => {
  return (
    <section id="cv" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity:0, y:20 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 text-transparent bg-clip-text bg-gradient-to-r from-accent via-pink-500 to-rose-500"
        >
          My Journey & Expertise
        </motion.h2>
        
        <div className="max-w-3xl mx-auto">
          <Section title="Summary" icon={Users}>
            <p className="text-gray-300 leading-relaxed text-md">{cvData.summary}</p>
          </Section>

          <Section title="Professional Experience" icon={Briefcase}>
            <div className="space-y-5">
              {cvData.experience.map(exp => <TimelineItem key={exp.id} item={exp} />)}
            </div>
          </Section>

          <Section title="Education" icon={GraduationCap}>
            <div className="space-y-5">
              {cvData.education.map(edu => <TimelineItem key={edu.id} item={edu} />)}
            </div>
          </Section>

          <Section title="Core Skills" icon={Code}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              {cvData.skills.sort((a,b) => b.level - a.level).map((skill, index) => <SkillBar key={skill.name} skill={skill} index={index} />)}
            </div>
          </Section>
        </div>
      </div>
    </section>
  );
};

export default InteractiveCV;