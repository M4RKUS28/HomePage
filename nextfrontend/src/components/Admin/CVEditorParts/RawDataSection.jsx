import React from 'react';
import { Save, Download } from 'lucide-react';

const RawDataSection = ({ rawDataText, onChange, onApply, onDownload }) => (
  <div className="section-card">
    <div className="flex justify-between items-center mb-4">
      <h3 className="section-title mb-0">Raw CV Data</h3>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApply}
          className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
        >
          <Save size={14} /> Apply & Save
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="btn btn-outline btn-sm inline-flex items-center gap-1.5"
        >
          <Download size={14} /> Download JSON
        </button>
      </div>
    </div>

    <div className="space-y-4">
      <p className="text-sm text-ink-2">
        Edit the raw JSON data directly. Be careful with the syntax - invalid JSON will be rejected.
      </p>

      <textarea
        className="input-field w-full min-h-[800px] font-mono text-sm resize-y"
        value={rawDataText}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Loading CV data..."
        spellCheck={false}
        style={{ height: '800px' }}
      />

      <div className="flex justify-between text-xs text-ink-3">
        <span>Use Ctrl+A to select all, Ctrl+C to copy</span>
        <span>Lines: {rawDataText.split('\n').length} | Characters: {rawDataText.length}</span>
      </div>
    </div>
  </div>
);

export default RawDataSection;
