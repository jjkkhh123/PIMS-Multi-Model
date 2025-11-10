
import React from 'react';
import { CategorizedData } from '../types';
import { ContactsList } from './ContactsList';
import { ScheduleList } from './ScheduleList';
import { ExpensesList } from './ExpensesList';
import { DiaryList } from './DiaryList';

interface DataDisplayProps {
  data: CategorizedData | null;
  isLoading: boolean;
}

export const DataDisplay: React.FC<DataDisplayProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <svg className="animate-spin h-8 w-8 text-cyan-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>처리 중입니다. 잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  if (!data || (data.contacts.length === 0 && data.schedule.length === 0 && data.expenses.length === 0 && data.diary.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <h2 className="text-xl font-bold mb-2">Personal Assistant</h2>
          <p>좌측 입력창에 메모, 일정, 영수증 내역 등을 입력하여</p>
          <p>자동으로 정보를 분류하고 정리해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ContactsList contacts={data.contacts} />
      <ScheduleList scheduleItems={data.schedule} />
      <ExpensesList expenses={data.expenses} />
      <DiaryList diaryEntries={data.diary} />
    </div>
  );
};
