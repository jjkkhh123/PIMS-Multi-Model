import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { MonthYearPicker } from './MonthYearPicker';
import { ExpenseDetailModal } from './ExpenseDetailModal';

interface ExpensesCalendarViewProps {
  expenses: Expense[];
  onAdd: (item: Omit<Expense, 'id' | 'imageUrl'>) => void;
  onUpdate: (item: Expense) => void;
  onDelete: (id: string) => void;
}

const toYYYYMMDD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};


export const ExpensesCalendarView: React.FC<ExpensesCalendarViewProps> = ({ expenses, onAdd, onUpdate, onDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    totalMonthlyIncome,
    totalMonthlyExpense,
    netMonthlyTotal,
    days
  } = useMemo(() => {
    const expensesForMonth = expenses.filter(expense => {
      const [year, month] = expense.date.split('-').map(Number);
      return year === currentDate.getFullYear() &&
             (month - 1) === currentDate.getMonth();
    });

    const totalMonthlyIncome = expensesForMonth
      .filter(e => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalMonthlyExpense = expensesForMonth
      .filter(e => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);
    
    const netMonthlyTotal = totalMonthlyIncome - totalMonthlyExpense;

    const expensesByDay = expensesForMonth.reduce((acc, expense) => {
      const day = parseInt(expense.date.split('-')[2], 10);
      if (!acc[day]) acc[day] = [];
      acc[day].push(expense);
      return acc;
    }, {} as Record<number, Expense[]>);
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const dayElements = [];
    for (let i = 0; i < startDay; i++) {
      dayElements.push(<div key={`empty-${i}`} className="border border-gray-700/50"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const expensesForDay = expensesByDay[i] || [];
      const totalIncome = expensesForDay.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
      const totalExpense = expensesForDay.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
      const isToday = new Date().toDateString() === dayDate.toDateString();

      dayElements.push(
        <button
          key={i}
          onClick={() => handleDayClick(i)}
          className={`p-2 border border-gray-700/50 text-left align-top ${isToday ? 'bg-cyan-500/10' : ''} min-h-[100px] flex flex-col transition-colors hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 z-10`}
        >
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
        </button>
      );
    }

    return { totalMonthlyIncome, totalMonthlyExpense, netMonthlyTotal, days: dayElements };
  }, [currentDate, expenses]);


  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  };
  
  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const closeModal = () => {
    setSelectedDate(null);
  };
  
  const now = new Date();
  const isNextMonthInFuture = currentDate.getFullYear() > now.getFullYear() || 
                             (currentDate.getFullYear() === now.getFullYear() && currentDate.getMonth() >= now.getMonth());

  return (
    <section className="h-full flex flex-col">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-700/50 p-3 rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-400">수입 총합</h3>
          <p className="text-xl font-bold text-red-400 mt-1">
            {totalMonthlyIncome.toLocaleString('ko-KR')}원
          </p>
        </div>
        <div className="bg-gray-700/50 p-3 rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-400">지출 총합</h3>
          <p className="text-xl font-bold text-blue-400 mt-1">
            {totalMonthlyExpense.toLocaleString('ko-KR')}원
          </p>
        </div>
        <div className="bg-gray-700/50 p-3 rounded-lg text-center">
          <h3 className="text-sm font-medium text-gray-400">수입 지출 정산</h3>
          <p className={`text-xl font-bold mt-1 ${netMonthlyTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netMonthlyTotal.toLocaleString('ko-KR')}원
          </p>
        </div>
      </div>
       <div className="flex items-center justify-center mb-4">
        <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500" aria-label="이전 달">&lt;</button>
        <MonthYearPicker
            selectedDate={currentDate}
            onChange={handleDateSelect}
        />
        <button onClick={() => changeMonth(1)} disabled={isNextMonthInFuture} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="다음 달">&gt;</button>
      </div>
      <div className="flex-grow flex flex-col">
        <div className="grid grid-cols-7">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-400 py-2 text-sm">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-grow">
          {days}
        </div>
      </div>
      {selectedDate && (
        <ExpenseDetailModal 
            date={selectedDate}
            items={expenses.filter(item => item.date === toYYYYMMDD(selectedDate))}
            onClose={closeModal}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onDelete={onDelete}
        />
      )}
    </section>
  );
};