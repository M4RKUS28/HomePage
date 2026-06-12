// Updated InteractiveCV.jsx to fetch data from backend
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useLanguage } from '../../contexts/LanguageContext';
import Spinner from '../UI/Spinner';
import { getCVDataApi } from '../../api/cv';

import {
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Users,
  ExternalLink,
  AlertTriangle,
  MousePointerClick
} from 'lucide-react';

// Helper function to parse markdown-style lists and links
const formatText = (text) => {
  if (!text) return null;
  
  // Split the text into lines
  const lines = text.split('\n');
  
  return lines.map((line, index) => {
    // Check if the line is a list item
    if (line.trim().startsWith('- ')) {
      return (
        <li key={index} className="ml-5 list-disc text-mode-secondary text-sm leading-relaxed mb-1">
          {line.trim().substring(2)}
        </li>
      );
    }
    // Regular paragraph
    return (
      <p key={index} className="text-mode-secondary text-sm leading-relaxed mb-2">
        {line}
      </p>
    );
  });
};

const Section = ({ title, children, icon: IconComponent, count }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="mb-14"
  >
    <div className="flex items-center gap-4 mb-7">
      {IconComponent && (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-accent">
          <IconComponent size={18} />
        </span>
      )}
      <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">{title}</h3>
      <span className="rule flex-1" />
      {typeof count === 'number' && count > 0 && (
        <span className="font-data text-xs text-ink-3">{String(count).padStart(2, '0')}</span>
      )}
    </div>
    {children}
  </motion.div>
);

const TimelineItem = ({ item, index = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const t = useTranslations('cv');
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
      className="timeline-item group relative"
      role="button"
      tabIndex={0}
      onClick={() => setIsOpen(prev => !prev)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setIsOpen(prev => !prev);
        }
      }}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <AnimatePresence>
        {isHovered && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute top-3 right-3 flex items-center rounded-md border border-line bg-raised px-2 py-1 font-data text-[10px] font-medium uppercase tracking-[0.12em] text-ink-2 shadow-lg"
          >
            <MousePointerClick size={12} className="mr-1" />
            {t('clickForDetails')}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="timeline-dot">
        {ItemIcon && <ItemIcon size={10} className="timeline-dot-icon" />}
      </div>
      
      <div className="flex items-center">
        {item.logo && typeof item.logo === 'string' && (
          <img 
            src={item.logo} 
            className="w-6 h-6 mr-2 object-contain" 
            alt={`${title} logo`}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <motion.h4 layout="position" className="project-title">{title || "Untitled"}</motion.h4>
      </div>
      
      <motion.p layout="position" className="project-subtitle">
        {subtitle}
        {subtitle && timeframe && <span className="project-date"> | </span>}
        {timeframe && <span className="project-date">{timeframe}</span>}
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
                    key={`link-${idx}`}
                    href={link.url ? String(link.url) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 font-data text-xs rounded-md border border-line bg-raised text-ink-2 hover:text-accent hover:border-accent transition-colors duration-200"
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
    className="mb-4"
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true, amount: 0.8 }}
    transition={{ duration: 0.5, delay: index * 0.05 }}
  >
    <div className="flex justify-between items-baseline mb-1.5">
      <span className="text-sm font-medium text-ink">{skill.name || "Unnamed Skill"}</span>
      <span className="font-data text-xs text-ink-3">{skill.level || 0}%</span>
    </div>
    <div className="skill-track">
      <motion.div
        className="skill-fill"
        initial={{ width: 0 }}
        whileInView={{ width: `${skill.level || 0}%` }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 1, delay: 0.2 + (index * 0.05), ease: "circOut" }}
      />
    </div>
  </motion.div>
);

const ProjectItem = ({ project, index = 0 }) => {
  return (
    <TimelineItem 
      item={{
        id: project.id,
        name: project.name,
        period: project.period,
        details: project.description,
        links: project.links,
        icon: Code,
        logo: project.logo
      }}
      index={index}
    />
  );
};

const AwardItem = ({ award, index = 0 }) => {
  return (
    <TimelineItem 
      item={{
        id: award.id,
        name: award.name,
        date: award.date,
        awardingBody: award.awardingBody,
        details: award.details,
        links: award.links,
        icon: Award,
        logo: award.logo
      }}
      index={index}
    />
  );
};

const InteractiveCV = () => {
  const t = useTranslations('cv');
  const { locale } = useLanguage();
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCVData = async () => {
      setLoading(true);
      try {
        const data = await getCVDataApi(locale);
        setCvData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching CV data:", err);
        setError('Failed to load CV data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCVData();
  }, [locale]);

  if (loading) {
    return (
      <section id="cv" className="py-16 md:py-24 flex justify-center items-center">
        <Spinner size="h-12 w-12" />
        <span className="ml-3 font-data text-sm text-ink-3">{t('loading')}</span>
      </section>
    );
  }

  if (error || !cvData) {
    return (
      <section id="cv" className="py-16 md:py-24 text-center">
        <div className="container mx-auto px-4">
          <div className="panel border-red-500/40 bg-red-500/10 text-red-300 p-8 max-w-xl mx-auto">
            <AlertTriangle size={44} className="mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-4">Couldn't Load CV Data</h3>
            <p>{error || "Something went wrong. Please try again later."}</p>
          </div>
        </div>
      </section>
    );
  }

  // Add default icon functions to each section
  const experience = (cvData.experience || [])
    .sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return (a.id || 0) - (b.id || 0);
    })
    .map(item => ({ ...item, icon: Briefcase }));
    
  const education = (cvData.education || [])
    .sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return (a.id || 0) - (b.id || 0);
    })
    .map(item => ({ ...item, icon: GraduationCap }));
    
  const projects = (cvData.projectsHighlight || [])
    .sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return (a.id || 0) - (b.id || 0);
    });
    
  const awards = (cvData.awards || [])
    .sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return (a.id || 0) - (b.id || 0);
    });
    
  const skills = cvData.skills || [];
  
  const volunteering = (cvData.volunteering || [])
    .sort((a, b) => {
      if (a.position !== undefined && b.position !== undefined) {
        return a.position - b.position;
      }
      return (a.id || 0) - (b.id || 0);
    })
    .map(item => ({ ...item, icon: Users }));
  const languages = cvData.languages || [];

  return (
    <section id="cv" className="relative py-20 md:py-28 border-y border-line bg-band">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <span className="eyebrow mb-3">
              <span className="status-dot status-dot--accent" />
              {t('subtitle')}
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-ink">
              {t('title')}
            </h2>
          </motion.div>

            <Section title={t('summary')} icon={Users}>
              <p className="text-ink-2 leading-relaxed text-md">{cvData.summary || t('noData')}</p>
            </Section>

            {skills.length > 0 && (
              <Section title={t('skills')} icon={Code} count={skills.length}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
                  {skills
                    .sort((a, b) => (b.level || 0) - (a.level || 0))
                    .map((skill, idx) => (
                      <SkillBar key={`skill-${skill.id ?? idx}`} skill={skill} index={idx} />
                    ))}
                </div>
              </Section>
            )}

            {experience.length > 0 && (
              <Section title={t('experience')} icon={Briefcase} count={experience.length}>
                <div className="space-y-5">
                  {experience.map((exp, idx) => <TimelineItem key={`exp-${exp.id || idx}-${exp.title || exp.company || idx}`} item={exp} index={idx} />)}
                </div>
              </Section>
            )}

            {education.length > 0 && (
              <Section title={t('education')} icon={GraduationCap} count={education.length}>
                <div className="space-y-5">
                  {education.map((edu, idx) => <TimelineItem key={`edu-${edu.id || idx}-${edu.institution || edu.degree || idx}`} item={edu} index={idx} />)}
                </div>
              </Section>
            )}

            {projects.length > 0 && (
              <Section title={t('projectsHighlight')} icon={Code} count={projects.length}>
                <div className="space-y-5">
                  {projects.map((proj, idx) => (
                    <ProjectItem key={`proj-${proj.id || idx}-${proj.name || proj.title || idx}`} project={proj} index={idx} />
                  ))}
                </div>
              </Section>
            )}

            {awards.length > 0 && (
              <Section title={t('awards')} icon={Award} count={awards.length}>
                <div className="space-y-5">
                  {awards.map((award, idx) => (
                    <AwardItem key={`award-${award.id || idx}-${award.title || idx}`} award={award} index={idx} />
                  ))}
                </div>
              </Section>
            )}

            {volunteering.length > 0 && (
              <Section title={t('volunteering')} icon={Users} count={volunteering.length}>
                <div className="space-y-5">
                  {volunteering.map((vol, idx) => <TimelineItem key={`vol-${vol.id || idx}-${vol.title || idx}`} item={vol} index={idx} />)}
                </div>
              </Section>
            )}

            {languages.length > 0 && (
              <Section title={t('languages')} icon={Users} count={languages.length}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {languages.map((lang, idx) => (
                    <div key={`lang-${lang.name || idx}-${lang.level || idx}`} className="language-item">
                      <h4 className="language-name">{lang.name || "Unknown Language"}</h4>
                      <p className="language-level">{lang.level || "Unspecified Level"}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
        </div>
      </div>
    </section>
  );
};

export default InteractiveCV;