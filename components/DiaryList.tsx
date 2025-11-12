import React, { useState, useMemo } from 'react';
import { DiaryEntry } from '../types.ts';
import { AddIcon, EditIcon, DeleteIcon, SaveIcon } from './icons.tsx';

// Props
interface DiaryListProps {
  diaryEntries: DiaryEntry[];
  onAdd?: (entry: Omit<DiaryEntry, 'id'>) => void;
  onUpdate?: (entry: DiaryEntry) => void;
  onDelete?: (id: string) => void;
}

// Form component for adding/editing
interface DiaryFormProps {
    entry?: DiaryEntry;
    onSave: (entry: DiaryEntry | Omit<DiaryEntry, 'id'>) => void;
    onCancel: () => void;
    allGroupNames: string[];
}

const DiaryForm: React.FC<DiaryFormProps> = ({ entry, onSave, onCancel, allGroupNames }) => {
    const [content, setContent] = useState(entry?.entry || '');
    const [date, setDate] = useState(entry?.date || new Date().toISOString().split('T')[0]);
    const [group, setGroup] = useState(entry?.group || '기타');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        onSave({
            ...(entry || {}),
            date,
            entry: content,
            group: group.trim() || '기타',
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-700 rounded-lg space-y-3 my-4">
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[120px] resize-y"
                placeholder="메모 내용..."
                required
                autoFocus
            />
            <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                     <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required
                    />
                    <input
                        type="text"
                        list="group-suggestions"
                        placeholder="그룹"
                        value={group}
                        onChange={e => setGroup(e.target.value)}
                        className="p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <datalist id="group-suggestions">
                        {allGroupNames.map(g => <option key={g} value={g} />)}
                    </datalist>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                        취소
                    </button>
                    <button type="submit" className="px-3 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 flex items-center gap-1">
                        <SaveIcon className="h-4 w-4" />
                        저장
                    </button>
                </div>
            </div>
        </form>
    );
};


export const DiaryList: React.FC<DiaryListProps> = ({ diaryEntries, onAdd, onUpdate, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'content-asc'>('date-desc');
    const readOnly = !onAdd || !onUpdate || !onDelete;

    const allGroupNames = useMemo(() => 
        // FIX: Explicitly type sort arguments as strings to resolve TypeScript inference error.
        Array.from(new Set(diaryEntries.map(e => e.group || '기타'))).sort((a: string, b: string) => a.localeCompare(b, 'ko'))
    , [diaryEntries]);

    const sortedEntries = useMemo(() => {
        return [...diaryEntries].sort((a, b) => {
            if (sortOrder === 'content-asc') {
                return a.entry.localeCompare(b.entry, 'ko');
            }
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'date-desc' ? dateB - dateA : dateA - dateB;
        });
    }, [diaryEntries, sortOrder]);

    const groupedEntries = useMemo(() => {
        return sortedEntries.reduce((acc, entry) => {
            const groupName = entry.group || '기타';
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(entry);
            return acc;
        }, {} as Record<string, DiaryEntry[]>);
    }, [sortedEntries]);

    const sortedGroupNames = useMemo(() => {
        return Object.keys(groupedEntries).sort((a, b) => {
            if (a === 'To-do list') return -1;
            if (b === 'To-do list') return 1;
            if (a === '기타') return 1;
            if (b === '기타') return -1;
            return a.localeCompare(b, 'ko');
        });
    }, [groupedEntries]);

    const handleSaveNew = (entry: Omit<DiaryEntry, 'id'>) => {
        onAdd?.(entry);
        setIsAdding(false);
    };

    const handleSaveUpdate = (entry: DiaryEntry) => {
        onUpdate?.(entry);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('이 메모를 삭제하시겠습니까?')) {
            onDelete?.(id);
        }
    };
    
    const controlsHeader = (
      <div className="flex justify-between items-center mb-4">
          {!readOnly ? (
              <button 
                  onClick={() => { setIsAdding(true); setEditingId(null); }}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed"
                  disabled={isAdding || !!editingId}
              >
                  <AddIcon className="h-5 w-5" />
                  새 메모 추가
              </button>
          ) : <div />}
          {diaryEntries.length > 0 && (
              <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'date-desc' | 'date-asc' | 'content-asc')}
                  className="bg-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  aria-label="메모 정렬"
              >
                  <option value="date-desc">최신순</option>
                  <option value="date-asc">오래된순</option>
                  <option value="content-asc">가나다순</option>
              </select>
          )}
      </div>
    );
    
    return (
        <div className="space-y-4">
            {controlsHeader}

            {isAdding && !readOnly && <DiaryForm onSave={handleSaveNew} onCancel={() => setIsAdding(false)} allGroupNames={allGroupNames} />}
            
            {diaryEntries.length === 0 && !isAdding && (
                <div className="text-center py-10 text-gray-500">
                    <p>저장된 메모가 없습니다.</p>
                    {!readOnly && <p className="text-sm mt-1">'새 메모 추가' 버튼을 눌러 시작하세요.</p>}
                </div>
            )}

            {diaryEntries.length > 0 && (
                 <div className="space-y-5">
                    {sortedGroupNames.map(groupName => (
                        <div key={groupName}>
                            <h4 className="text-sm font-bold uppercase text-gray-400 mb-2 px-1 tracking-wider">{groupName}</h4>
                            <div className="space-y-3">
                                {groupedEntries[groupName].map(entry => (
                                    editingId === entry.id && !readOnly ? (
                                        <DiaryForm 
                                            key={entry.id} 
                                            entry={entry} 
                                            onSave={(e) => handleSaveUpdate(e as DiaryEntry)} 
                                            onCancel={() => setEditingId(null)}
                                            allGroupNames={allGroupNames}
                                        />
                                    ) : (
                                        <div key={entry.id} className="p-4 bg-gray-700/50 rounded-lg group">
                                           <div className="flex justify-between items-start">
                                                <p className="text-sm text-gray-400 mb-2 font-medium">{entry.date}</p>
                                                {!readOnly && (
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => { setEditingId(entry.id); setIsAdding(false); }} className="p-1 text-gray-400 hover:text-cyan-400" disabled={isAdding || !!editingId}>
                                                            <EditIcon className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => handleDelete(entry.id)} className="p-1 text-gray-400 hover:text-red-400">
                                                            <DeleteIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                )}
                                           </div>
                                           <p className="text-gray-200 whitespace-pre-wrap">{entry.entry}</p>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
            )}
        </div>
    );
};