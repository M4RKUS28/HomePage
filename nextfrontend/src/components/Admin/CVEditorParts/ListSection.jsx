import React from 'react';
import { Plus, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';

const ListSection = ({
  sectionKey,
  title,
  items,
  addButtonLabel = 'Add Item',
  renderItem,
  onAdd,
  onMoveUp,
  onMoveDown,
  onEdit,
  onRemove,
  theme,
}) => {
  const sortedItems = [...(items || [])].sort((a, b) => {
    if (a?.position !== undefined && b?.position !== undefined) {
      return a.position - b.position;
    }
    return (a?.id || 0) - (b?.id || 0);
  });

  return (
    <div className="section-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="section-title mb-0">{title}</h3>
        <button type="button" onClick={() => onAdd(sectionKey)} className="btn btn-sm btn-primary flex items-center">
          <Plus size={14} className="mr-1" /> {addButtonLabel}
        </button>
      </div>

      {sortedItems.length > 0 ? (
        <div className="space-y-4">
          {sortedItems.map((item, index) => {
            const itemId = item.id ?? `${sectionKey}-${index}`;

            return (
              <div
                key={itemId}
                className={`cv-item-card border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-md p-4`}
              >
                {renderItem(item)}
                <div className="flex justify-between items-center mt-3">
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => onMoveUp(sectionKey, itemId)}
                      disabled={index === 0}
                      className={`btn btn-sm flex items-center ${
                        index === 0 ? 'cv-btn-secondary opacity-50 cursor-not-allowed' : 'cv-btn-secondary'
                      }`}
                      title="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveDown(sectionKey, itemId)}
                      disabled={index === sortedItems.length - 1}
                      className={`btn btn-sm flex items-center ${
                        index === sortedItems.length - 1
                          ? 'cv-btn-secondary opacity-50 cursor-not-allowed'
                          : 'cv-btn-secondary'
                      }`}
                      title="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => onEdit(sectionKey, { ...item, id: itemId })}
                      className={`btn btn-sm flex items-center ${
                        theme === 'dark'
                          ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      <Edit size={14} className="mr-1" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(sectionKey, itemId)}
                      className={`btn btn-sm flex items-center ${
                        theme === 'dark'
                          ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      <Trash2 size={14} className="mr-1" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="cv-empty-state">No items yet. Click "Add Item" to get started.</p>
      )}
    </div>
  );
};

export default ListSection;
