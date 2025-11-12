import React, { useState } from 'react';
import { ScheduleItem } from '../types.ts';
import { ClockIcon } from './icons.tsx';
import { MonthYearPicker } from './MonthYearPicker.tsx';
import { ScheduleDetailModal } from './ScheduleDetailModal.tsx';

interface CalendarViewProps {
  scheduleItems: ScheduleItem[];
  onAdd: (item: Omit<ScheduleItem, 'id'>) => void;
  onUpdate: (item: ScheduleItem) => void;
  onDelete: (id: string) => void;
}

const toYYYYMMDD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const CalendarView: React.FC<CalendarViewProps> = ({ scheduleItems, onAdd, onUpdate, onDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const closeModal = () => {
    setSelectedDate(null);
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysInMonth = endOfMonth.getDate();

  const days = [];
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="border border-gray-700/50"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const dateString = toYYYYMMDD(dayDate);
    const itemsForDay = scheduleItems.filter(item => item.date === dateString);
    const isToday = new Date().toDateString() === dayDate.toDateString();

    days.push(
      <button
        key={i}
        onClick={() => handleDayClick(i)}
        className={`p-2 border border-gray-700/50 text-left align-top ${isToday ? 'bg-cyan-500/10' : ''} min-h-[120px] transition-colors hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 z-10`}
      >
        <div className={`font-bold text-right ${isToday ? 'text-cyan-300' : 'text-gray-300'}`}>{i}</div>
        <div className="mt-1 space-y-1">
          {itemsForDay.slice(0, 3).map(item => (
            <div key={item.id} className="bg-gray-600/50 p-1.5 rounded text-xs">
              <p className="font-semibold text-white truncate">{item.title}</p>
               <div className="flex items-center gap-1 text-gray-400 truncate">
                {item.time && <ClockIcon className="h-3 w-3 flex-shrink-0" />}
                <span>{item.time}</span>
              </div>
            </div>
          ))}
          {itemsForDay.length > 3 && (
            <div className="text-xs text-gray-400 text-center mt-1">...외 {itemsForDay.length - 3}개</div>
          )}
        </div>
      </button>
    );
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  };

  return (
    <section>
       <div className="flex items-center justify-center mb-4">
        <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500" aria-label="이전 달">&lt;</button>
        <MonthYearPicker
            selectedDate={currentDate}
            onChange={handleDateSelect}
            disableFutureDates={false}
        />
        <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500" aria-label="다음 달">&gt;</button>
      </div>
      <div className="grid grid-cols-7">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-400 py-2 text-sm">{day}</div>
        ))}
      </div>
       <div className="grid grid-cols-7">
        {days}
      </div>
      {selectedDate && (
        <ScheduleDetailModal 
            date={selectedDate}
            items={scheduleItems.filter(item => item.date === toYYYYMMDD(selectedDate))}
            onClose={closeModal}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onDelete={onDelete}
        />
      )}
    </section>
  );
};