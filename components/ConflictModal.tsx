import React from 'react';
import { Contact, ScheduleItem, Expense } from '../types';
import { ContactIcon, ScheduleIcon, ExpenseIcon } from './icons';

interface Conflicts {
  contacts: Contact[];
  schedule: ScheduleItem[];
  expenses: Expense[];
}

interface ConflictModalProps {
  conflicts: Conflicts;
  onConfirm: () => void;
  onCancel: () => void;
  onIgnore: () => void;
}

const renderConflictList = (title: string, items: { name?: string; title?: string; item?: string }[], Icon: React.FC<React.SVGProps<SVGSVGElement>>) => {
  if (items.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <h4 className="font-bold text-cyan-300 text-sm mb-2 flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {title}
      </h4>
      <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 pl-2">
        {items.map((item, index) => (
          <li key={index}>{item.name || item.title || item.item}</li>
        ))}
      </ul>
    </div>
  );
};


export const ConflictModal: React.FC<ConflictModalProps> = ({ conflicts, onConfirm, onCancel, onIgnore }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-3">중복된 항목 발견</h2>
          <p className="text-gray-300 mb-5">
            입력하신 내용 중 일부가 기존 데이터와 중복됩니다. 어떻게 처리하시겠습니까?
          </p>
          
          <div className="bg-gray-900/50 p-4 rounded-lg max-h-60 overflow-y-auto">
            {renderConflictList('연락처', conflicts.contacts, ContactIcon)}
            {renderConflictList('일정', conflicts.schedule, ScheduleIcon)}
            {renderConflictList('지출/수입 내역', conflicts.expenses, ExpenseIcon)}
          </div>
        </div>

        <div className="flex justify-end items-center p-4 bg-gray-900/50 rounded-b-lg gap-3">
          <button 
            onClick={onIgnore} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
          >
            무시하고 추가
          </button>
          <button 
            onClick={onCancel} 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500"
          >
            취소
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
          >
            덮어쓰기
          </button>
        </div>
      </div>
    </div>
  );
};