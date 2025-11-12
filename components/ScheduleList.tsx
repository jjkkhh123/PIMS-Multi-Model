import React from 'react';
import { ScheduleItem } from '../types.ts';
import { ScheduleIcon, ClockIcon, LocationIcon } from './icons.tsx';

interface ScheduleListProps {
  scheduleItems: ScheduleItem[];
  showTitle?: boolean;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ scheduleItems, showTitle = true }) => {
  if (scheduleItems.length === 0) return null;

  const listContent = (
    <ul className="space-y-3">
      {scheduleItems.map((item) => (
        <li key={item.id} className="p-3 bg-gray-700/50 rounded-lg">
          <p className="font-bold text-white">{item.title}</p>
          <p className="text-sm text-gray-300 font-medium">{item.date}</p>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
              {item.time && (
                  <span className="flex items-center gap-1.5"><ClockIcon className="h-4 w-4" />{item.time}</span>
              )}
              {item.location && (
                  <span className="flex items-center gap-1.5"><LocationIcon className="h-4 w-4" />{item.location}</span>
              )}
          </div>
        </li>
      ))}
    </ul>
  );

  if (!showTitle) {
    return listContent;
  }

  return (
    <section>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-cyan-300">
        <ScheduleIcon className="h-6 w-6" />
        일정
      </h3>
      {listContent}
    </section>
  );
};