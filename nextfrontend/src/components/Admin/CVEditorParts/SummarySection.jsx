import React from 'react';

const SummarySection = ({ summary, onChange }) => (
  <div className="section-card">
    <h3 className="section-title">Summary</h3>
    <textarea
      className="input-field w-full h-40"
      value={summary}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write a brief professional summary..."
    />
  </div>
);

export default SummarySection;
