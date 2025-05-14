import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Users,
  Zap as SkillIcon,
  ExternalLink
} from 'lucide-react';

const cvData = {
  summary: "As a business informatics student, I combine a strong academic foundation with a passion for connecting business and technology. I enjoy working in collaborative, innovative environments and am motivated to keep learning and growing in the digital world.",

  experience: [
    {
      id: 1,
      role: "Working Student Data Analyst",
      company: "Siemens Global Business Services",
      period: "Nov 2024 – Mar 2025",
      details: `
- Data analysis and processing with KNIME  
- Creation of dashboards and visualizations in Power BI  
- Design and setup of database structures in Microsoft Access
      `.trim(),
      icon: Briefcase,
      logo: "https://upload.wikimedia.org/wikipedia/commons/5/5f/Siemens-logo.svg"
    },
  ],

  education: [
    {
      id: 1,
      degree: "B.Sc. in Business Informatics",
      institution: "Technische Universität München",
      period: "Oct 2023 – Present",
      details: "Currently enrolled in the Bachelor of Science programme in Wirtschaftsinformatik.",
      icon: GraduationCap,
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Logo_of_the_Technical_University_of_Munich.svg/2560px-Logo_of_the_Technical_University_of_Munich.svg.png"
    },
    {
      id: 2,
      degree: "Abitur",
      institution: "Luitpold Gymnasium Wasserburg",
      period: "Sep 2015 – Jun 2023",
      details: "",
      icon: GraduationCap,
      logo: null
    },
  ],

  projectsHighlight: [
    {
      id: 2,
      name: "Mandelbrot Set Visualizer",
      period: "Oct 2022 – Present",
      description: `
- Realized theoretical investigations from W-Seminar paper  
- Developed a C++/Qt application for interactive fractal rendering`,
      links: [
        {
          text: "Live demo",
          url: "https://m4rkus28.github.io/Fraktalgenerator"
        }
      ],
      icon: Code,
      logo: "https://github.com/M4RKUS28/Fraktalgenerator/blob/ebc6ed28b1b0ae4813db7d4dcf07146df0b7343f/docs/103199188.png?raw=true"
    },{
      id: 1,
      name: "Barcode Scanner for Delicatessen",
      period: "Apr 2022 – Dec 2022",
      description: `
- Programmed the software for a custom barcode scanner  
- Built and connected the backend database and web server  
- Designed a Qt-based GUI for end users`,
      links: [
        {
          text: "Code & demo",
          url: "https://github.com/Benefranko/Barcode-Scanner-Feinkost-"
        }
      ],
      icon: Code,
      logo: null
    }
  ],

  awards: [
    {
      id: 1,
      name: "1st Place, CHECK24 Challenge at TUM.ai Makeathon",
      date: "Apr 2025",
      details: "3-day AI hackathon solving real-world business cases. Project: SmartStay24.",
      links: [
        {
          text: "GitHub",
          url: "https://github.com/M4RKUS28/SmartStay24"
        }
      ],
      icon: Award,
      awardingBody: "TUM.ai",
      logo: null
    },
    {
      id: 2,
      name: "GenDev IT Scholarship",
      date: "Feb 2025",
      awardingBody: "CHECK24",
      icon: Award,
      logo: null
    },
    {
      id: 3,
      name: "Deutschlandstipendium",
      date: "Oct 2024",
      awardingBody: "Technische Universität München",
      icon: Award,
      logo: null
    },
    {
      id: 4,
      name: "GI Computer Science Prize",
      date: "Jun 2023",
      awardingBody: "Gesellschaft für Informatik e.V.",
      details: "One year of free GI benefits for outstanding achievements in computer science.",
      icon: Award,
      logo: null
    },
    {
      id: 5,
      name: "1st Place, 6th Salzburg Robothon",
      date: "Apr 2023",
      awardingBody: "FH Salzburg",
      details: "24-hour robot design & programming competition.",
      icon: Award,
      logo: null
    },
    {
      id: 6,
      name: "1st Prize, 41st Federal Computer Science Competition (Round 1)",
      date: "Jan 2023",
      awardingBody: "BMBF",
      icon: Award,
      logo: null
    },
    {
      id: 7,
      name: "1st Prize, 40th Federal Computer Science Competition (Round 1)",
      date: "Jan 2022",
      awardingBody: "BMBF",
      icon: Award,
      logo: null
    },
  ],

  skills: [
    { name: "Python", level: 90, icon: SkillIcon },
    { name: "C++ / Qt", level: 95, icon: SkillIcon },
    { name: "SQL", level: 85, icon: SkillIcon },
    { name: "HTML & CSS", level: 70, icon: SkillIcon },
    { name: "Git", level: 85, icon: SkillIcon },
    { name: "KNIME", level: 85, icon: SkillIcon },
    { name: "Power BI", level: 80, icon: SkillIcon },
    { name: "Linux", level: 85, icon: SkillIcon },
    { name: "Self-learning & teamwork", level: 100, icon: SkillIcon },
    { name: "Java", level: 80, icon: SkillIcon },
    { name: "Java Script", level: 70, icon: SkillIcon },
    { name: "Ocaml", level: 95, icon: SkillIcon },

  ],

  volunteering: [
    {
      id: 1,
      role: "Volunteer Leader Boy Scouts",
      organization: "Scouts Stamm Marinus Rott am Inn",
      period: "Feb 2023 – Present",
      details: `
- Organized and led youth meetings and outings  
- Planned and executed community projects and events  
- Liaised with parents and partner organizations`,
      icon: Users,
      logo: null
    },
  ],

  languages: [
    { name: "German", level: "C2" },
    { name: "English", level: "B2" },
  ],
};

// Helper function to parse markdown-style lists and links
const formatText = (text) => {
  if (!text) return null;
  
  // Split the text into lines
  const lines = text.split('\n');
  
  return lines.map((line, index) => {
    // Check if the line is a list item
    if (line.trim().startsWith('- ')) {
      return (
        <li key={index} className="ml-5 list-disc text-gray-400 text-sm leading-relaxed mb-1">
          {line.trim().substring(2)}
        </li>
      );
    }
    // Regular paragraph
    return (
      <p key={index} className="text-gray-400 text-sm leading-relaxed mb-2">
        {line}
      </p>
    );
  });
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
  
  // Extract details and links
  const details = item.details || item.description;
  const links = item.links || [];
  
  // Get the name or role or degree
  const title = item.name || item.role || item.degree;
  
  // Get the subtitle (company, institution, or awarding body)
  const subtitle = item.company || item.institution || item.awardingBody || "";
  
  // Get the period or date
  const timeframe = item.period || item.date || "";
  
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
      
      <div className="flex items-center">
        {item.logo && (
          <img src={item.logo} className="w-6 h-6 mr-2 object-contain" />
        )}
        <motion.h4 layout="position" className="text-lg font-medium text-gray-100 cursor-pointer">{title}</motion.h4>
      </div>
      
      <motion.p layout="position" className="text-sm text-primary">
        {subtitle}
        {subtitle && timeframe && <span className="text-gray-500"> | </span>}
        {timeframe && <span className="text-gray-500">{timeframe}</span>}
      </motion.p>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            layout
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2"
          >
            {details && (
              <ul className="mb-3">
                {formatText(details)}
              </ul>
            )}
            
            {links && links.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {links.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-gray-700 hover:bg-primary text-white transition-colors duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={12} className="mr-1" />
                    {link.text}
                  </a>
                ))}
              </div>
            )}
          </motion.div>
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

const ProjectItem = ({ project }) => {
  return (
    <TimelineItem 
      item={{
        id: project.id,
        name: project.name,
        period: project.period,
        details: project.description,
        links: project.links,
        icon: project.icon,
        logo: project.logo
      }}
    />
  );
};

const AwardItem = ({ award }) => {
  return (
    <TimelineItem 
      item={{
        id: award.id,
        name: award.name,
        date: award.date,
        awardingBody: award.awardingBody,
        details: award.details,
        links: award.links,
        icon: award.icon,
        logo: award.logo
      }}
    />
  );
};

const InteractiveCV = () => {
  return (
    <section id="cv" className="py-16 md:py-24 bg-gray-900 text-white">
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

            <Section title="Core Skills" icon={Code}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                {cvData.skills
                  .sort((a, b) => b.level - a.level)
                  .map((skill, idx) => <SkillBar key={skill.name} skill={skill} index={idx} />)}
              </div>
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

            <Section title="Projects" icon={Code}>
              <div className="space-y-5">
                {cvData.projectsHighlight.map(proj => (
                  <ProjectItem key={proj.id} project={proj} />
                ))}
              </div>
            </Section>

            <Section title="Awards" icon={Award}>
              <div className="space-y-5">
                {cvData.awards.map(award => (
                  <AwardItem key={award.id} award={award} />
                ))}
              </div>
            </Section>

            <Section title="Volunteering" icon={Users}>
              <div className="space-y-5">
                {cvData.volunteering.map(vol => <TimelineItem key={vol.id} item={vol} />)}
              </div>
            </Section>

            <Section title="Languages" icon={Users}>
              <div className="grid grid-cols-2 gap-4">
                {cvData.languages.map((lang, idx) => (
                  <div key={idx} className="bg-gray-800 p-3 rounded-lg" style={{ margin: "12px 0 0 0" }}>
                    <h4 className="text-lg font-medium text-gray-100">{lang.name}</h4>
                    <p className="text-primary">{lang.level}</p>
                  </div>
                ))}
              </div>
            </Section>
        </div>
      </div>
    </section>
  );
};

export default InteractiveCV;