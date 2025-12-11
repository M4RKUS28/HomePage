import React from 'react';

const CVSectionNav = ({ activeSection, onChange, navItems }) => {
  return (
    <div className="mb-8 flex gap-2">
      {navItems.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`nav-button text-sm px-3 py-2.5 flex-1 ${activeSection === key ? 'active' : ''}`}
        >
          <Icon size={15} className="mr-1.5" /> {label}
        </button>
      ))}
    </div>
  );
};

export default CVSectionNav;
