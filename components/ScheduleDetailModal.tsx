import React, { useState, useEffect } from 'react';
import { ScheduleItem } from '../types.ts';
import { AddIcon, EditIcon, DeleteIcon, SaveIcon, ClockIcon, LocationIcon } from './icons.tsx';

// Props for the form
interface ScheduleFormProps {
    scheduleItem?: ScheduleItem;
    onSave: (item: Omit<ScheduleItem, 'id'> | ScheduleItem) => void;
    onCancel: () => void;
    selectedDate: string; // YYYY-MM-DD
}

const ScheduleForm: React.FC<ScheduleFormProps> = ({ scheduleItem, onSave, onCancel, selectedDate }) => {
    const [title, setTitle] = useState(scheduleItem?.title || '');
    const [time, setTime] = useState(scheduleItem?.time || '');
    const [location, setLocation] = useState(scheduleItem?.location || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({
            ...(scheduleItem || {}),
            title: title.trim(),
            date: selectedDate,
            time: time.trim() || undefined,
            location: location.trim() || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-700 rounded-lg space-y-3 my-4">
             <input
                type="text"
                placeholder="일정 제목"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                  type="time"
                  placeholder="시간 (선택 사항)"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
               <input
                    type="text"
                    placeholder="장소 (선택 사항)"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                    취소
                </button>
                <button type="submit" className="px-3 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 flex items-center gap-1">
                    <SaveIcon className="h-4 w-4" />
                    저장
                </button>
            </div>
        </form>
    );
};


interface ScheduleDetailModalProps {
  date: Date;
  items: ScheduleItem[];
  onClose: () => void;
  onAdd: (item: Omit<ScheduleItem, 'id'>) => void;
  onUpdate: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
}

export const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({ date, items, onClose, onAdd, onUpdate, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateString = `${y}-${m}-${d}`;
    
    const formattedDate = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    const handleSaveNew = (item: Omit<ScheduleItem, 'id'>) => {
        onAdd(item);
        setIsAdding(false);
    };

    const handleSaveUpdate = (item: ScheduleItem) => {
        onUpdate(item);
        setEditingItem(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('이 일정을 삭제하시겠습니까?')) {
            onDelete(id);
        }
    };
    
    // Reset form states when modal is closed or items change
    useEffect(() => {
        setIsAdding(false);
        setEditingItem(null);
    }, [date]);

    return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-cyan-400">{formattedDate}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            {items.length === 0 && !isAdding && !editingItem && (
                 <div className="text-center py-10 text-gray-500">
                    <p>등록된 일정이 없습니다.</p>
                </div>
            )}
            
            {items.length > 0 && (
                <div className="space-y-3">
                    {items.map(item => (
                        editingItem?.id === item.id ? (
                            <ScheduleForm 
                                key={item.id}
                                scheduleItem={item}
                                onSave={(updatedItem) => handleSaveUpdate(updatedItem as ScheduleItem)}
                                onCancel={() => setEditingItem(null)}
                                selectedDate={dateString}
                            />
                        ) : (
                            <div key={item.id} className="p-3 bg-gray-700/50 rounded-lg group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-white">{item.title}</p>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                            {item.time && (
                                                <span className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4" />{item.time}</span>
                                            )}
                                            {item.location && (
                                                <span className="flex items-center gap-1.5"><LocationIcon className="h-4 w-4" />{item.location}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingItem(item); setIsAdding(false); }} className="p-1 text-gray-400 hover:text-cyan-400" disabled={isAdding || !!editingItem}>
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-400">
                                            <DeleteIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}
            
            {isAdding && (
                 <ScheduleForm 
                    onSave={(newItem) => handleSaveNew(newItem as Omit<ScheduleItem, 'id'>)}
                    onCancel={() => setIsAdding(false)}
                    selectedDate={dateString}
                />
            )}
        </div>
        
        <div className="p-4 border-t border-gray-700 mt-auto">
            <button
                onClick={() => { setIsAdding(true); setEditingItem(null); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed"
                disabled={isAdding || !!editingItem}
            >
                <AddIcon className="h-5 w-5" />
                새 일정 추가
            </button>
        </div>
      </div>
    </div>
    );
}