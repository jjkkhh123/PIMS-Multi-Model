
import React from 'react';
import { DiaryEntry } from '../types.ts';
import { DiaryIcon } from './icons.tsx';

interface DiaryListProps {
  diaryEntries: DiaryEntry[];
}

export const DiaryList: React.FC<DiaryListProps> = ({ diaryEntries }) => {
  if (diaryEntries.length === 0) return null;

  return (
    <section>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-cyan-300">
        <DiaryIcon className="h-6 w-6" />
        일기
      </h3>
      <ul className="space-y-3">
        {diaryEntries.map((entry) => (
          <li key={entry.id} className="p-3 bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">{entry.date}</p>
            <p className="text-gray-200 whitespace-pre-wrap">{entry.entry}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
