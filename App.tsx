import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { processChat } from './services/geminiService';
import type { ProcessedData, CategorizedData, HistoryItem, View, Expense, Contact, ScheduleItem, DiaryEntry, ChatMessage, ChatSession } from './types';
import { HistoryList } from './components/HistoryList';
import { CalendarView } from './components/CalendarView';
import { ContactsList } from './components/ContactsList';
import { ScheduleList } from './components/ScheduleList';
import { ExpensesList } from './components/ExpensesList';
import { DiaryList } from './components/DiaryList';
import { HistoryDetailModal } from './components/HistoryDetailModal';
import { ConflictModal } from './components/ConflictModal';
import { MonthYearPicker } from './components/MonthYearPicker';
import { ExpensesCalendarView } from './components/ExpensesCalendarView';
import { ChatInterface } from './components/ChatInterface';
import { ExpensesStatsView } from './components/ExpensesStatsView';
import { MenuIcon } from './components/icons';

// A simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

const LOCAL_STORAGE_KEY = 'lifeos-app-state';

const getInitialState = () => {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_KEY);
    return item ? JSON.parse(item) : {};
  } catch (error) {
    console.error("Error reading from local storage", error);
    return {};
  }
};

const App: React.FC = () => {
  const initialStateRef = useRef(getInitialState());
  const initialState = initialStateRef.current;
  const importFileRef = useRef<HTMLInputElement>(null);

  const [hasInteracted, setHasInteracted] = useState(initialState.hasInteracted || false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(initialState.history || []);
  const [contacts, setContacts] = useState<Contact[]>(initialState.contacts || []);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialState.schedule || []);
  const [expenses, setExpenses] = useState<Expense[]>(initialState.expenses || []);
  const [diary, setDiary] = useState<DiaryEntry[]>(initialState.diary || []);
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(initialState.chatSessions || []);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | 'new'>(initialState.activeChatSessionId || 'new');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('ALL');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [selectedIncomeMonth, setSelectedIncomeMonth] = useState(new Date());
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState(new Date());
  
  // State to hold the original user input when AI asks for clarification
  const [pendingClarificationInput, setPendingClarificationInput] = useState<HistoryItem['input'] | null>(null);


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

  useEffect(() => {
    try {
      const stateToSave = {
        hasInteracted,
        history,
        contacts,
        schedule,
        expenses,
        diary,
        chatSessions,
        activeChatSessionId,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Error saving state to local storage", error);
    }
  }, [hasInteracted, history, contacts, schedule, expenses, diary, chatSessions, activeChatSessionId]);

  const initialMessages: ChatMessage[] = [];

  const addIdsToData = (data: ProcessedData): CategorizedData => {
    return {
      contacts: data.contacts.map(c => ({ ...c, id: generateId(), group: c.group || '기타' })),
      schedule: data.schedule.map(s => ({ ...s, id: generateId() })),
      expenses: data.expenses.map(e => ({ ...e, id: generateId() })),
      diary: data.diary.map(d => ({ ...d, id: generateId(), group: d.group || '기타' })),
    };
  };

  const addDataToState = (categorizedResult: CategorizedData, input: HistoryItem['input']) => {
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
        input,
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
      setSchedule(prev => [...prev, ...categorizedResult.schedule].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.time || '').localeCompare(b.time || '')));
      setExpenses(prev => [...prev, ...categorizedResult.expenses]);
      setDiary(prev => [...prev, ...categorizedResult.diary]);
  };

  const getPrunedContextData = () => {
    const MAX_CONTACTS_LITE = 200;
    const MAX_SCHEDULE_ITEMS = 50; // Will be split between past and future
    const MAX_EXPENSE_ITEMS = 100;
    const MAX_DIARY_ENTRIES = 30;

    // Prune contacts: send only name and group to reduce token size.
    const liteContacts = contacts.slice(0, MAX_CONTACTS_LITE).map(c => ({ name: c.name, group: c.group }));

    // Prune schedule: provide a mix of recent past and upcoming events.
    const todayStr = new Date().toISOString().split('T')[0];
    const pastSchedule = schedule.filter(s => s.date < todayStr).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // descending from recent past
    const futureSchedule = schedule.filter(s => s.date >= todayStr).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // ascending from today

    const prunedSchedule = [
        ...futureSchedule.slice(0, Math.ceil(MAX_SCHEDULE_ITEMS / 2)),
        ...pastSchedule.slice(0, Math.floor(MAX_SCHEDULE_ITEMS / 2))
    ];

    // Prune expenses: sort by date descending and take the most recent items.
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const prunedExpenses = sortedExpenses.slice(0, MAX_EXPENSE_ITEMS);

    // Prune diary: sort by date descending and take the most recent items.
    const sortedDiary = [...diary].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const prunedDiary = sortedDiary.slice(0, MAX_DIARY_ENTRIES);

    return {
        contacts: liteContacts,
        schedule: prunedSchedule,
        expenses: prunedExpenses,
        diary: prunedDiary,
    };
  };

  const handleSendMessage = async (text: string, image: File | null) => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    setIsLoading(true);
    setError(null);

    let imageUrl: string | null = null;
    if (image) {
      imageUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(image);
      });
    }
    
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      text,
      imageUrl,
    };

    // This is the original input that will be logged to history
    const userInputLog: HistoryItem['input'] = {
        text,
        imageName: image?.name || null,
        imageUrl,
    };
    
    let currentSessionId = activeChatSessionId;
    let chatHistoryForApi: ChatMessage[] = [];

    if (currentSessionId === 'new') {
        const newSessionId = generateId();
        const newSession: ChatSession = {
            id: newSessionId,
            title: text.substring(0, 30) || image?.name || "새 대화",
            messages: [userMessage],
        };
        setChatSessions(prev => [newSession, ...prev]);
        setActiveChatSessionId(newSessionId);
        currentSessionId = newSessionId;
    } else {
        const session = chatSessions.find(s => s.id === currentSessionId)!;
        chatHistoryForApi = [...session.messages];
        const updatedSession = { ...session, messages: [...session.messages, userMessage] };
        setChatSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
    }


    try {
      const contextData = getPrunedContextData();
      const result = await processChat(chatHistoryForApi, text, image, contextData);
      
      // Handle clarification query from AI
      if (result.clarificationNeeded) {
        const modelMessage: ChatMessage = {
            id: generateId(),
            role: 'model',
            text: result.answer,
            clarificationOptions: result.clarificationOptions,
        };
        
        // Don't save the user's clarification *reply* to history, save the original input.
        // So if there's no pending input, this is the original ambiguous one.
        if (!pendingClarificationInput) {
            setPendingClarificationInput(userInputLog);
        }
        
        setChatSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, modelMessage] } : s));
        return; // Stop processing, wait for user's clarifying response
      }

      let modelMessage: ChatMessage | null = null;
      if (result.answer) {
        modelMessage = {
          id: generateId(),
          role: 'model',
          text: result.answer,
        };
      }

      setChatSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
            const newMessages = [...s.messages];
            if (modelMessage) {
                newMessages.push(modelMessage);
            }
            return { ...s, messages: newMessages };
        }
        return s;
      }));

      const extractedData = result.dataExtraction;
      const hasExtractedData = 
        extractedData.contacts.length > 0 ||
        extractedData.schedule.length > 0 ||
        extractedData.expenses.length > 0 ||
        extractedData.diary.length > 0;

      if (hasExtractedData) {
        const categorizedResult = addIdsToData(extractedData);
        
        // If there was a pending clarification, use its image for the result
        const finalImageUrl = pendingClarificationInput?.imageUrl || imageUrl;

        if (finalImageUrl && categorizedResult.expenses.length > 0) {
          categorizedResult.expenses.forEach(expense => {
            expense.imageUrl = finalImageUrl;
          });
        }
        
        // If this was a result of a clarification, use the original input for the history log.
        const inputForHistory = pendingClarificationInput || userInputLog;
        
        addDataToState(categorizedResult, inputForHistory);
        setPendingClarificationInput(null); // Clear pending state after successful processing
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      const errorMessageItem: ChatMessage = {
        id: generateId(),
        role: 'model',
        text: `오류가 발생했습니다: ${errorMessage}`,
      };
      setChatSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
            return { ...s, messages: [...s.messages, errorMessageItem] };
        }
        return s;
      }));
      setPendingClarificationInput(null); // Clear on error too
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setHasInteracted(false);
    setActiveView('ALL');
    setActiveChatSessionId('new');
    setPendingClarificationInput(null);
  };

  const handleSelectChat = (sessionId: string) => {
    setActiveView('ALL');
    setActiveChatSessionId(sessionId);
     setPendingClarificationInput(null);
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
    setDiary(prev => [...prev.filter(d => !categorizedResult.diary.some(nd => nd.id === d.id)), ...categorizedResult.diary]);

    setConflictData(null);
  };

  const handleConflictCancel = () => {
    setConflictData(null);
  };

  const handleConflictIgnoreAndAdd = () => {
    if (!conflictData) return;
    const { categorizedResult, newHistoryItem } = conflictData;

    // Add new items without removing duplicates, effectively creating duplicate entries
    setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
    setContacts(prev => [...prev, ...categorizedResult.contacts]);
    setSchedule(prev => [...prev, ...categorizedResult.schedule]);
    setExpenses(prev => [...prev, ...categorizedResult.expenses]);
    setDiary(prev => [...prev, ...categorizedResult.diary]);

    setConflictData(null);
  };
  
  // CRUD Handlers for Contacts
  const handleAddContact = (contact: Omit<Contact, 'id'>) => {
    const newContact = { ...contact, id: generateId(), group: contact.group || '기타' };
    setContacts(prev => [newContact, ...prev]);
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(prev => prev.map(c => (c.id === updatedContact.id ? { ...updatedContact, group: updatedContact.group || '기타' } : c)));
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  // CRUD Handlers for Schedule
  const handleAddSchedule = (item: Omit<ScheduleItem, 'id'>) => {
    const newScheduleItem = { ...item, id: generateId() };
    setSchedule(prev => [...prev, newScheduleItem].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.time || '').localeCompare(b.time || '')));
  };

  const handleUpdateSchedule = (updatedItem: ScheduleItem) => {
    setSchedule(prev => prev.map(s => (s.id === updatedItem.id ? updatedItem : s)));
  };

  const handleDeleteSchedule = (itemId: string) => {
    setSchedule(prev => prev.filter(s => s.id !== itemId));
  };

  // CRUD Handlers for Expenses
  const handleAddExpense = (expense: Omit<Expense, 'id' | 'imageUrl'>) => {
    const newExpense = { ...expense, id: generateId(), imageUrl: null };
    setExpenses(prev => [...prev, newExpense].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => (e.id === updatedExpense.id ? updatedExpense : e)));
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };
  
  // CRUD Handlers for Diary
  const handleAddDiary = (entry: Omit<DiaryEntry, 'id'>) => {
    const newEntry = { ...entry, id: generateId(), group: entry.group || '기타' };
    setDiary(prev => [newEntry, ...prev]);
  };

  const handleUpdateDiary = (updatedEntry: DiaryEntry) => {
    setDiary(prev => prev.map(d => (d.id === updatedEntry.id ? { ...updatedEntry, group: updatedEntry.group || '기타' } : d)));
  };

  const handleDeleteDiary = (diaryId: string) => {
    setDiary(prev => prev.filter(d => d.id !== diaryId));
  };

  const handleExportData = () => {
    try {
      const stateToSave = {
        hasInteracted,
        history,
        contacts,
        schedule,
        expenses,
        diary,
        chatSessions,
        activeChatSessionId,
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(stateToSave, null, 2)
      )}`;
      const link = document.createElement("a");
      link.href = jsonString;
      const date = new Date().toISOString().split('T')[0];
      link.download = `lifeos_backup_${date}.json`;

      link.click();
    } catch (error) {
      console.error("Failed to export data", error);
      alert("데이터 내보내기에 실패했습니다.");
    }
  };

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File could not be read as text.");
        }
        const importedState = JSON.parse(text);

        // Basic validation
        if (
          !importedState ||
          !Array.isArray(importedState.contacts) ||
          !Array.isArray(importedState.schedule) ||
          !Array.isArray(importedState.expenses) ||
          !Array.isArray(importedState.diary) ||
          !Array.isArray(importedState.history) ||
          !Array.isArray(importedState.chatSessions)
        ) {
          throw new Error("Invalid file format.");
        }
        
        if (window.confirm("기존의 모든 데이터를 덮어쓰고 가져온 데이터로 교체하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
          setHasInteracted(importedState.hasInteracted ?? true);
          setHistory(importedState.history ?? []);
          setContacts(importedState.contacts ?? []);
          setSchedule(importedState.schedule ?? []);
          setExpenses(importedState.expenses ?? []);
          setDiary(importedState.diary ?? []);
          setChatSessions(importedState.chatSessions ?? []);
          setActiveChatSessionId(importedState.activeChatSessionId ?? 'new');
          
          alert("데이터를 성공적으로 가져왔습니다.");
        }

      } catch (error) {
        console.error("Failed to import data", error);
        alert("데이터 가져오기에 실패했습니다. 파일이 올바른 형식인지 확인해주세요.");
      } finally {
        // Reset file input so the same file can be selected again
        if(event.target) {
            event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };


  const renderContent = () => {
    if (activeView === 'ALL') {
       let messagesToShow: ChatMessage[];
      if (activeChatSessionId === 'new') {
        messagesToShow = initialMessages;
      } else {
        const activeSession = chatSessions.find(s => s.id === activeChatSessionId);
        messagesToShow = activeSession ? activeSession.messages : initialMessages;
      }
      return (
        <ChatInterface 
          messages={messagesToShow}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
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
            content = (
              <CalendarView 
                scheduleItems={schedule} 
                onAdd={handleAddSchedule}
                onUpdate={handleUpdateSchedule}
                onDelete={handleDeleteSchedule}
              />
            );
            break;
        case 'EXPENSES_DASHBOARD':
            title = '가계부 대시보드';
            content = (
              <ExpensesCalendarView 
                expenses={expenses} 
                onAdd={handleAddExpense}
                onUpdate={handleUpdateExpense}
                onDelete={handleDeleteExpense}
              />
            );
            break;
        case 'EXPENSES_INCOME': {
            title = '수입 내역';
            const incomeItems = expenses.filter(e => e.type === 'income');
            
            const handleIncomeMonthChange = (offset: number) => {
                setSelectedIncomeMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
            };
            
            const handleIncomeDateSelect = (date: Date) => {
                const now = new Date();
                if (date.getFullYear() > now.getFullYear() || (date.getFullYear() === now.getFullYear() && date.getMonth() > now.getMonth())) {
                    return;
                }
                setSelectedIncomeMonth(date);
            };

            const now = new Date();
            const isNextMonthInFuture = selectedIncomeMonth.getFullYear() > now.getFullYear() || 
                                       (selectedIncomeMonth.getFullYear() === now.getFullYear() && selectedIncomeMonth.getMonth() >= now.getMonth());

            const filteredIncomeItems = incomeItems.filter(item => {
                const [year, month] = item.date.split('-').map(Number);
                return year === selectedIncomeMonth.getFullYear() &&
                       (month - 1) === selectedIncomeMonth.getMonth();
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const totalIncomeForMonth = filteredIncomeItems.reduce((sum, expense) => sum + expense.amount, 0);

            content = (
              <div className="flex flex-col h-full">
                {/* Summary section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-center">
                    <button onClick={() => handleIncomeMonthChange(-1)} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500">&lt;</button>
                    <MonthYearPicker
                        selectedDate={selectedIncomeMonth}
                        onChange={handleIncomeDateSelect}
                    />
                    <button onClick={() => handleIncomeMonthChange(1)} disabled={isNextMonthInFuture} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">&gt;</button>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400">해당 월 총 수입</h3>
                    <p className="text-2xl font-bold text-green-400 mt-1">
                      {totalIncomeForMonth.toLocaleString('ko-KR')}원
                    </p>
                  </div>
                </div>

                {/* History section */}
                <div className="flex-grow flex flex-col bg-gray-700/30 p-4 rounded-lg min-h-0">
                  <h3 className="text-lg font-semibold mb-3 text-cyan-300">수입 내역 기록</h3>
                  <div className="flex-grow overflow-y-auto pr-2">
                    {filteredIncomeItems.length > 0 ? (
                      <ExpensesList 
                          expenses={filteredIncomeItems} 
                          onUpdate={handleUpdateExpense}
                          onDelete={handleDeleteExpense}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">해당 월의 수입 내역이 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            break;
        }
        case 'EXPENSES_EXPENSE': {
            title = '지출 내역';
            const expenseItems = expenses.filter(e => e.type === 'expense');
            
            const handleExpenseMonthChange = (offset: number) => {
                setSelectedExpenseMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
            };

            const handleExpenseDateSelect = (date: Date) => {
                const now = new Date();
                if (date.getFullYear() > now.getFullYear() || (date.getFullYear() === now.getFullYear() && date.getMonth() > now.getMonth())) {
                    return;
                }
                setSelectedExpenseMonth(date);
            };

            const now = new Date();
            const isNextMonthInFuture = selectedExpenseMonth.getFullYear() > now.getFullYear() || 
                                       (selectedExpenseMonth.getFullYear() === now.getFullYear() && selectedExpenseMonth.getMonth() >= now.getMonth());

            const filteredExpenseItems = expenseItems.filter(item => {
                const [year, month] = item.date.split('-').map(Number);
                return year === selectedExpenseMonth.getFullYear() &&
                       (month - 1) === selectedExpenseMonth.getMonth();
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const totalExpenseForMonth = filteredExpenseItems.reduce((sum, expense) => sum + expense.amount, 0);


            content = (
              <div className="flex flex-col h-full">
                {/* Summary section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-center">
                    <button onClick={() => handleExpenseMonthChange(-1)} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500">&lt;</button>
                     <MonthYearPicker
                        selectedDate={selectedExpenseMonth}
                        onChange={handleExpenseDateSelect}
                    />
                    <button onClick={() => handleExpenseMonthChange(1)} disabled={isNextMonthInFuture} className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">&gt;</button>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400">해당 월 총 지출</h3>
                    <p className="text-2xl font-bold text-red-400 mt-1">
                      {totalExpenseForMonth.toLocaleString('ko-KR')}원
                    </p>
                  </div>
                </div>

                {/* History section */}
                <div className="flex-grow flex flex-col bg-gray-700/30 p-4 rounded-lg min-h-0">
                  <h3 className="text-lg font-semibold mb-3 text-cyan-300">지출 내역 기록</h3>
                  <div className="flex-grow overflow-y-auto pr-2">
                    {filteredExpenseItems.length > 0 ? (
                      <ExpensesList 
                          expenses={filteredExpenseItems} 
                          onUpdate={handleUpdateExpense}
                          onDelete={handleDeleteExpense}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">해당 월의 지출 내역이 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            break;
        }
        case 'EXPENSES_STATS':
            title = '가계부 통계';
            content = <ExpensesStatsView expenses={expenses} />;
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
            title = '메모장';
            content = <DiaryList 
                        diaryEntries={diary} 
                        onAdd={handleAddDiary}
                        onUpdate={handleUpdateDiary}
                        onDelete={handleDeleteDiary}
                      />;
            break;
    }
     return (
        <div className="flex-grow p-6 h-full">
            <div className="h-full flex flex-col bg-gray-900/50 p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4 text-cyan-400">{title}</h1>
                <div className="flex-grow overflow-y-auto pr-2 min-h-0">
                    {content}
                </div>
            </div>
        </div>
    );
  };
  
  const handleSidebarViewChange = (view: View) => {
    setActiveView(view);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const handleSidebarSelectChat = (sessionId: string) => {
    handleSelectChat(sessionId);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const sidebarComponent = (
    <Sidebar 
      activeView={activeView} 
      onViewChange={handleSidebarViewChange}
      chatSessions={chatSessions}
      activeChatSessionId={activeChatSessionId}
      onSelectChat={handleSidebarSelectChat}
      onNewChat={handleNewChat}
      onExport={handleExportData}
      onImport={handleImportClick}
    />
  );

  const hamburgerButton = (
    <button 
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="absolute top-6 left-6 text-gray-400 hover:text-white z-30 p-2 rounded-md hover:bg-gray-700/50"
      aria-label="Toggle sidebar"
    >
      <MenuIcon className="h-6 w-6" />
    </button>
  );


  if (!hasInteracted) {
    const messagesToShow: ChatMessage[] = [];
    
    return (
      <div className="bg-gray-800 text-gray-100 font-sans h-screen flex">
        {isSidebarOpen && sidebarComponent}
        <div className="relative flex-grow h-full flex flex-col items-center justify-end p-4">
          {hamburgerButton}
          <div className="flex-grow flex items-center justify-center">
            <h1 className="text-6xl md:text-7xl font-bold text-white tracking-wider">LifeOS</h1>
          </div>
          <div className="w-full max-w-3xl">
            <ChatInterface 
              messages={messagesToShow}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isInitialView={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 text-gray-100 font-sans h-screen flex">
      <input
        type="file"
        ref={importFileRef}
        onChange={handleImportData}
        className="hidden"
        accept="application/json"
      />
      {isSidebarOpen && sidebarComponent}
      <main className="relative flex-grow h-full">
        {hamburgerButton}
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
          onIgnore={handleConflictIgnoreAndAdd}
        />
      )}
    </div>
  );
};

export default App;