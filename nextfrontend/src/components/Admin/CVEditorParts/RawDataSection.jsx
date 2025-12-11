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
          className="btn btn-sm bg-blue-900/50 text-blue-300 hover:bg-blue-900/70 flex items-center"
        >
          <Save size={14} className="mr-1" /> Apply Changes
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="btn btn-sm bg-green-900/50 text-green-300 hover:bg-green-900/70 flex items-center"
        >
          <Download size={14} className="mr-1" /> Download JSON
        </button>
      </div>
    </div>

    <div className="space-y-4">
      <p className="text-sm text-gray-400">
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

      <div className="flex justify-between text-xs text-gray-500">
        <span>Use Ctrl+A to select all, Ctrl+C to copy</span>
        <span>Lines: {rawDataText.split('\n').length} | Characters: {rawDataText.length}</span>
      </div>
    </div>
  </div>
);

export default RawDataSection;
