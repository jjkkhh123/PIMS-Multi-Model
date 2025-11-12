import React from 'react';
import { HistoryItem } from '../types';
import { ScheduleList } from './ScheduleList';
import { ExpensesList } from './ExpensesList';
import { DiaryList } from './DiaryList';
import { ContactIcon, ScheduleIcon, ExpenseIcon, DiaryIcon, PhoneIcon, EmailIcon } from './icons.tsx';

interface HistoryDetailModalProps {
  item: HistoryItem;
  onClose: () => void;
}

export const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ item, onClose }) => {
  const hasOutput = item.output.contacts.length > 0 ||
                    item.output.schedule.length > 0 ||
                    item.output.expenses.length > 0 ||
                    item.output.diary.length > 0;
                    
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-cyan-400">처리 내역 상세</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <section>
            <h3 className="text-lg font-semibold text-gray-300 mb-3">입력 정보</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
              {item.input.text && (
                <div>
                  <h4 className="font-bold text-cyan-300 text-sm mb-1">텍스트</h4>
                  <p className="text-gray-200 whitespace-pre-wrap">{item.input.text}</p>
                </div>
              )}
              {item.input.imageUrl && (
                 <div>
                  <h4 className="font-bold text-cyan-300 text-sm mb-1">이미지</h4>
                  <img src={item.input.imageUrl} alt="User upload" className="mt-2 rounded-lg max-w-full h-auto max-h-64 object-contain" />
                </div>
              )}
            </div>
          </section>

          <section>
             <h3 className="text-lg font-semibold text-gray-300 mb-3">처리 결과</h3>
             <div className="bg-gray-900/50 p-4 rounded-lg">
                {hasOutput ? (
                    <div className="space-y-6">
                        {item.output.contacts.length > 0 && (
                            <section>
                                <h4 className="text-md font-semibold flex items-center gap-2 text-cyan-300 mb-2">
                                    <ContactIcon className="h-5 w-5" />
                                    연락처
                                </h4>
                                <div className="space-y-2">
                                    {item.output.contacts.map(contact => (
                                        <div key={contact.id} className="p-3 bg-gray-700/50 rounded-lg">
                                            <p className="font-bold text-white">{contact.name}</p>
                                            {contact.phone && <p className="text-sm text-gray-300 flex items-center gap-2 mt-1"><PhoneIcon className="h-4 w-4" />{contact.phone}</p>}
                                            {contact.email && <p className="text-sm text-gray-300 flex items-center gap-2 mt-1"><EmailIcon className="h-4 w-4" />{contact.email}</p>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {item.output.schedule.length > 0 && (
                            <section>
                                <h4 className="text-md font-semibold flex items-center gap-2 text-cyan-300 mb-2">
                                    <ScheduleIcon className="h-5 w-5" />
                                    일정
                                </h4>
                                <ScheduleList scheduleItems={item.output.schedule} showTitle={false} />
                            </section>
                        )}
                        {item.output.expenses.length > 0 && (
                            <section>
                                <h4 className="text-md font-semibold flex items-center gap-2 text-cyan-300 mb-2">
                                    <ExpenseIcon className="h-5 w-5" />
                                    수입/지출
                                </h4>
                                <ExpensesList expenses={item.output.expenses} />
                            </section>
                        )}
                        {item.output.diary.length > 0 && (
                           <section>
                                <h4 className="text-md font-semibold flex items-center gap-2 text-cyan-300 mb-2">
                                    <DiaryIcon className="h-5 w-5" />
                                    메모장
                                </h4>
                               <DiaryList diaryEntries={item.output.diary} />
                           </section>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-4">분류된 데이터가 없습니다.</p>
                )}
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};