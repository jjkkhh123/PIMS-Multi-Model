import React, { useState } from 'react';
import { InputArea } from './components/InputArea';
import { Sidebar } from './components/Sidebar';
import { processUserInput } from './services/geminiService';
import type { ProcessedData, CategorizedData, HistoryItem, View, Expense, Contact, ScheduleItem, DiaryEntry } from './types';
import { HistoryList } from './components/HistoryList';
import { CalendarView } from './components/CalendarView';
import { ContactsList } from './components/ContactsList';
import { ScheduleList } from './components/ScheduleList';
import { ExpensesList } from './components/ExpensesList';
import { DiaryList } from './components/DiaryList';
import { HistoryDetailModal } from './components/HistoryDetailModal';
import { ConflictModal } from './components/ConflictModal';
import { ExpenseIcon } from './components/icons';

// A simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

const App: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('ALL');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  // State to manage the conflict resolution modal
  const [conflictData, setConflictData] = useState<{
    conflicts: {
      contacts: Contact[];
      schedule: ScheduleItem[];
      expenses: Expense[];
    };
    categorizedResult: CategorizedData;
    conflictingOriginalIds: {
      contacts: string[];
      schedule: string[];
      expenses: string[];
    };
    newHistoryItem: HistoryItem;
  } | null>(null);


  const addIdsToData = (data: ProcessedData): CategorizedData => {
    return {
      contacts: data.contacts.map(c => ({ ...c, id: generateId() })),
      schedule: data.schedule.map(s => ({ ...s, id: generateId() })),
      expenses: data.expenses.map(e => ({ ...e, id: generateId() })),
      diary: data.diary.map(d => ({ ...d, id: generateId() })),
    };
  };

  const handleProcess = async (text: string, image: File | null) => {
    setIsLoading(true);
    setError(null);

    try {
      let imageUrl: string | null = null;
      if (image) {
        imageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(image);
        });
      }

      const result = await processUserInput(text, image);
      const categorizedResult = addIdsToData(result);
      
      if (imageUrl && categorizedResult.expenses.length > 0) {
        categorizedResult.expenses.forEach(expense => {
          expense.imageUrl = imageUrl;
        });
      }
      
      // --- DUPLICATION CHECK LOGIC ---
      const conflicts = {
        contacts: [] as Contact[],
        schedule: [] as ScheduleItem[],
        expenses: [] as Expense[],
      };
      const conflictingOriginalIds = {
        contacts: [] as string[],
        schedule: [] as string[],
        expenses: [] as string[],
      };

      const normalizePhone = (phone?: string) => phone ? phone.replace(/\D/g, '') : '';

      categorizedResult.contacts.forEach(newContact => {
        const newPhoneNormalized = normalizePhone(newContact.phone);
        // Only check for duplicates if a non-empty phone number is present.
        if (newPhoneNormalized) {
          const existing = contacts.find(c => normalizePhone(c.phone) === newPhoneNormalized);
          if (existing) {
            conflicts.contacts.push(newContact);
            conflictingOriginalIds.contacts.push(existing.id);
          }
        }
      });

      categorizedResult.schedule.forEach(newSchedule => {
        const existing = schedule.find(s => 
          s.title.trim().toLowerCase() === newSchedule.title.trim().toLowerCase() && 
          s.date === newSchedule.date
        );
        if (existing) {
          conflicts.schedule.push(newSchedule);
          conflictingOriginalIds.schedule.push(existing.id);
        }
      });

      categorizedResult.expenses.forEach(newExpense => {
        const existing = expenses.find(e => 
          e.item.trim().toLowerCase() === newExpense.item.trim().toLowerCase() && 
          e.date === newExpense.date &&
          e.amount === newExpense.amount &&
          e.type === newExpense.type
        );
        if (existing) {
          conflicts.expenses.push(newExpense);
          conflictingOriginalIds.expenses.push(existing.id);
        }
      });

      const hasConflicts = conflicts.contacts.length > 0 || conflicts.schedule.length > 0 || conflicts.expenses.length > 0;
      
      const newHistoryItem: HistoryItem = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        input: { text, imageName: image?.name || null, imageUrl },
        output: categorizedResult,
      };

      if (hasConflicts) {
        setConflictData({
          conflicts,
          categorizedResult,
          conflictingOriginalIds,
          newHistoryItem,
        });
        return; // Stop processing, let the modal handle the next step
      }
      
      // If no conflicts, update state directly
      setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
      setContacts(prev => [...prev, ...categorizedResult.contacts]);
      setSchedule(prev => [...prev, ...categorizedResult.schedule]);
      setExpenses(prev => [...prev, ...categorizedResult.expenses]);
      setDiary(prev => [...prev, ...categorizedResult.diary]);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConflictConfirm = () => {
    if (!conflictData) return;

    const { categorizedResult, conflictingOriginalIds, newHistoryItem } = conflictData;

    setHistory(prev => [newHistoryItem, ...prev]);

    setContacts(prev => [
      ...prev.filter(c => !conflictingOriginalIds.contacts.includes(c.id)), 
      ...categorizedResult.contacts
    ]);
    setSchedule(prev => [
      ...prev.filter(s => !conflictingOriginalIds.schedule.includes(s.id)), 
      ...categorizedResult.schedule
    ]);
    setExpenses(prev => [
      ...prev.filter(e => !conflictingOriginalIds.expenses.includes(e.id)), 
      ...categorizedResult.expenses
    ]);
    setDiary(prev => [...prev, ...categorizedResult.diary]);

    setConflictData(null);
  };

  const handleConflictCancel = () => {
    setConflictData(null);
  };
  
  // CRUD Handlers for Contacts
  const handleAddContact = (contact: Omit<Contact, 'id'>) => {
    const newContact = { ...contact, id: generateId() };
    setContacts(prev => [newContact, ...prev]);
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => (c.id === updatedContact.id ? updatedContact : c)));
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  // CRUD Handlers for Expenses
  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => (e.id === updatedExpense.id ? updatedExpense : e)));
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };


  const renderContent = () => {
    if (activeView === 'ALL') {
      return (
        <div className="flex-grow flex items-center justify-center p-6" style={{ height: '100vh' }}>
          <div className="w-full max-w-2xl flex flex-col bg-gray-900/50 p-8 rounded-lg shadow-lg" style={{minHeight: '500px'}}>
            <h1 className="text-3xl font-bold mb-2 text-cyan-400 text-center">LifeOS</h1>
            <p className="text-gray-400 mb-8 text-center">당신의 삶의 모든 것을 한 곳에서 관리하세요.</p>
            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{error}</div>}
            <InputArea onProcess={handleProcess} isLoading={isLoading} />
          </div>
        </div>
      );
    }

    let title = '';
    let content: React.ReactNode = null;

    switch(activeView) {
        case 'HISTORY':
            title = '처리 내역';
            content = (
              <>
                {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{error}</div>}
                {isLoading && history.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-400">
                            <svg className="animate-spin h-8 w-8 text-cyan-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p>처리 중입니다...</p>
                        </div>
                    </div>
                ) : (
                    <HistoryList history={history} onSelectItem={setSelectedHistoryItem} isLoading={isLoading}/>
                )}
              </>
            );
            break;
        case 'CALENDAR':
            title = '캘린더';
            content = <CalendarView scheduleItems={schedule} />;
            break;
        case 'EXPENSES_DASHBOARD':
            title = '가계부 대시보드';
            content = <p className="text-gray-400 text-center mt-8">대시보드 기능은 곧 제공될 예정입니다.</p>;
            break;
        case 'EXPENSES_INCOME': {
            title = '수입 내역';
            const incomeItems = expenses.filter(e => e.type === 'income');
            content = incomeItems.length > 0 ? (
                <ExpensesList 
                    expenses={incomeItems} 
                    onUpdate={handleUpdateExpense}
                    onDelete={handleDeleteExpense}
                />
            ) : <p className="text-gray-400 text-center mt-8">데이터가 없습니다.</p>;
            break;
        }
        case 'EXPENSES_EXPENSE': {
            title = '지출 내역';
            const expenseItems = expenses.filter(e => e.type === 'expense');
            content = expenseItems.length > 0 ? (
                <ExpensesList 
                    expenses={expenseItems} 
                    onUpdate={handleUpdateExpense}
                    onDelete={handleDeleteExpense}
                />
            ) : <p className="text-gray-400 text-center mt-8">데이터가 없습니다.</p>;
            break;
        }
        case 'EXPENSES_STATS':
            title = '가계부 통계';
            content = <p className="text-gray-400 text-center mt-8">통계 기능은 곧 제공될 예정입니다.</p>;
            break;
        case 'CONTACTS':
            title = '연락처';
            content = <ContactsList 
                        contacts={contacts} 
                        onAdd={handleAddContact}
                        onUpdate={handleUpdateContact}
                        onDelete={handleDeleteContact}
                      />;
            break;
        case 'DIARY':
            title = '기타 메모';
            content = diary.length > 0 ? <DiaryList diaryEntries={diary} /> : <p className="text-gray-400 text-center mt-8">데이터가 없습니다.</p>;
            break;
    }
     return (
        <div className="flex-grow p-6" style={{ height: '100vh' }}>
            <div className="h-full flex flex-col bg-gray-900/50 p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4 text-cyan-400">{title}</h1>
                <div className="flex-grow overflow-y-auto pr-2">
                    {content}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="bg-gray-800 text-gray-100 font-sans min-h-screen flex">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-grow">
        {renderContent()}
      </main>
      {selectedHistoryItem && (
        <HistoryDetailModal 
          item={selectedHistoryItem} 
          onClose={() => setSelectedHistoryItem(null)} 
        />
      )}
      {conflictData && (
        <ConflictModal
          conflicts={conflictData.conflicts}
          onConfirm={handleConflictConfirm}
          onCancel={handleConflictCancel}
        />
      )}
    </div>
  );
};

export default App;