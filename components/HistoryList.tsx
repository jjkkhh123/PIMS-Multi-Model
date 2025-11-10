import React from 'react';
import { HistoryItem } from '../types';

interface HistoryListProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  isLoading: boolean;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelectItem, isLoading }) => {
  if (history.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10 text-gray-500 h-full flex flex-col justify-center">
        <p className="font-semibold">처리 내역이 없습니다.</p>
        <p className="text-sm mt-1">입력을 시작하여 데이터를 정리하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isLoading && history.length > 0 && (
         <div className="w-full text-left p-3 bg-gray-700/50 rounded-lg flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-gray-300">새로운 내역 처리 중...</span>
         </div>
      )}
      {history.map((item) => {
        const incomeItems = item.output.expenses.filter(e => e.type === 'income');
        const expenseItems = item.output.expenses.filter(e => e.type === 'expense');
        
        return (
          <button
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="w-full text-left p-3 bg-gray-700/50 rounded-lg transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <div className="flex justify-between items-center">
              <p className="font-semibold text-gray-200 truncate pr-2">
                {item.input.text || item.input.imageName || 'Image Input'}
              </p>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {new Date(item.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1 flex gap-x-3 gap-y-1 flex-wrap">
              {item.output.contacts.length > 0 && <span>연락처: {item.output.contacts.length}</span>}
              {item.output.schedule.length > 0 && <span>일정: {item.output.schedule.length}</span>}
              {incomeItems.length > 0 && <span>수입: {incomeItems.length}</span>}
              {expenseItems.length > 0 && <span>지출: {expenseItems.length}</span>}
              {item.output.diary.length > 0 && <span>일기: {item.output.diary.length}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
};