import React, { useState } from 'react';
import { Expense } from '../types';
import { MonthYearPicker } from './MonthYearPicker';

interface ExpensesCalendarViewProps {
  expenses: Expense[];
}

export const ExpensesCalendarView: React.FC<ExpensesCalendarViewProps> = ({ expenses }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysInMonth = endOfMonth.getDate();

  const days = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="border border-gray-700/50"></div>);
  }

  // Add cells for each day of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const dateString = dayDate.toISOString().split('T')[0];
    
    // Filter expenses for the current day
    const expensesForDay = expenses.filter(expense => expense.date === dateString);
    
    // Calculate total income and expense
    const totalIncome = expensesForDay
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
      
    const totalExpense = expensesForDay
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    const isToday = new Date().toDateString() === dayDate.toDateString();

    days.push(
      <div key={i} className={`p-2 border border-gray-700/50 ${isToday ? 'bg-cyan-500/10' : ''} min-h-[100px] flex flex-col`}>
        <div className={`font-bold text-right text-sm ${isToday ? 'text-cyan-300' : 'text-gray-300'}`}>{i}</div>
        <div className="mt-1 space-y-1 text-xs overflow-hidden">
          {totalIncome > 0 && (
            <p className="text-red-400 font-semibold truncate" title={`수입: +${totalIncome.toLocaleString('ko-KR')}원`}>
              +{totalIncome.toLocaleString('ko-KR')}
            </p>
          )}
          {totalExpense > 0 && (
            <p className="text-blue-400 font-semibold truncate" title={`지출: -${totalExpense.toLocaleString('ko-KR')}원`}>
              -{totalExpense.toLocaleString('ko-KR')}
            </p>
          )}
        </div>
      </div>
    );
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  };
  
  const now = new Date();
  const isNextMonthInFuture = currentDate.getFullYear() > now.getFullYear() || 
                             (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() >= now.getMonth());

  return (
    <section>
       <div className="flex items-center justify-center mb-4">
        <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500" aria-label="이전 달">&lt;</button>
        <MonthYearPicker
            selectedDate={currentDate}
            onChange={handleDateSelect}
        />
        <button onClick={() => changeMonth(1)} disabled={isNextMonthInFuture} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="다음 달">&gt;</button>
      </div>
      <div className="grid grid-cols-7">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="text-center font-semibold text-gray-400 py-2 text-sm">{day}</div>
        ))}
      </div>
       <div className="grid grid-cols-7">
        {days}
      </div>
    </section>
  );
};