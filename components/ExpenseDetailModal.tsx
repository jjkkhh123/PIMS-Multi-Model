import React, { useState, useEffect } from 'react';
import { Expense } from '../types.ts';
import { AddIcon, EditIcon, DeleteIcon, SaveIcon } from './icons.tsx';

// Props for the form
interface ExpenseFormProps {
    expenseItem?: Expense;
    onSave: (item: Omit<Expense, 'id' | 'imageUrl'> | Expense) => void;
    onCancel: () => void;
    selectedDate: string; // YYYY-MM-DD
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expenseItem, onSave, onCancel, selectedDate }) => {
    const [item, setItem] = useState(expenseItem?.item || '');
    const [amount, setAmount] = useState(expenseItem?.amount.toString() || '');
    const [category, setCategory] = useState(expenseItem?.category || '');
    const [type, setType] = useState<'expense' | 'income'>(expenseItem?.type || 'expense');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const parsedAmount = parseFloat(amount);
        if (!item.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

        onSave({
            ...(expenseItem || {}),
            item: item.trim(),
            amount: parsedAmount,
            date: selectedDate,
            type: type,
            category: category.trim() || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-700 rounded-lg space-y-3 my-4">
             <input
                type="text"
                placeholder="항목"
                value={item}
                onChange={e => setItem(e.target.value)}
                className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
                autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
                <input
                    type="number"
                    placeholder="금액"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                />
                 <input
                    type="text"
                    placeholder="카테고리 (선택 사항)"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>
            <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2 cursor-pointer text-white">
                    <input type="radio" name="expenseType" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} className="form-radio text-cyan-500 bg-gray-600 border-gray-500 focus:ring-cyan-500" />
                    지출
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-white">
                    <input type="radio" name="expenseType" value="income" checked={type === 'income'} onChange={() => setType('income')} className="form-radio text-green-500 bg-gray-600 border-gray-500 focus:ring-green-500"/>
                    수입
                </label>
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                    취소
                </button>
                <button type="submit" className="px-3 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 flex items-center gap-1">
                    <SaveIcon className="h-4 w-4" />
                    저장
                </button>
            </div>
        </form>
    );
};


interface ExpenseDetailModalProps {
  date: Date;
  items: Expense[];
  onClose: () => void;
  onAdd: (item: Omit<Expense, 'id' | 'imageUrl'>) => void;
  onUpdate: (item: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ date, items, onClose, onAdd, onUpdate, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<Expense | null>(null);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateString = `${y}-${m}-${d}`;
    
    const formattedDate = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

    const handleSaveNew = (item: Omit<Expense, 'id' | 'imageUrl'>) => {
        onAdd(item);
        setIsAdding(false);
    };

    const handleSaveUpdate = (item: Expense) => {
        onUpdate(item);
        setEditingItem(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('이 내역을 삭제하시겠습니까?')) {
            onDelete(id);
        }
    };
    
    useEffect(() => {
        setIsAdding(false);
        setEditingItem(null);
    }, [date]);

    return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-cyan-400">{formattedDate}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
            {items.length === 0 && !isAdding && !editingItem && (
                 <div className="text-center py-10 text-gray-500">
                    <p>등록된 내역이 없습니다.</p>
                </div>
            )}
            
            {items.length > 0 && (
                <div className="space-y-3">
                    {items.map(item => (
                        editingItem?.id === item.id ? (
                            <ExpenseForm 
                                key={item.id}
                                expenseItem={item}
                                onSave={(updatedItem) => handleSaveUpdate(updatedItem as Expense)}
                                onCancel={() => setEditingItem(null)}
                                selectedDate={dateString}
                            />
                        ) : (
                            <div key={item.id} className="p-3 bg-gray-700/50 rounded-lg group flex justify-between items-center">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  {item.imageUrl && (
                                    <img 
                                      src={item.imageUrl} 
                                      alt="Receipt thumbnail" 
                                      className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                                    />
                                  )}
                                  <div className="overflow-hidden">
                                    <p className="font-semibold text-white truncate">{item.item}</p>
                                    <p className="text-sm text-gray-400 truncate">{item.category}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className={`font-bold text-lg ${item.type === 'income' ? 'text-green-400' : 'text-cyan-400'}`}>
                                    {item.type === 'income' ? '+' : ''}{item.amount.toLocaleString('ko-KR')}원
                                    </p>
                                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingItem(item); setIsAdding(false); }} className="p-1 text-gray-400 hover:text-cyan-400" disabled={isAdding || !!editingItem}>
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-400">
                                            <DeleteIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}
            
            {isAdding && (
                 <ExpenseForm 
                    // Fix: Corrected the Omit syntax to use a union type for multiple keys.
                    onSave={(newItem) => handleSaveNew(newItem as Omit<Expense, 'id' | 'imageUrl'>)}
                    onCancel={() => setIsAdding(false)}
                    selectedDate={dateString}
                />
            )}
        </div>
        
        <div className="p-4 border-t border-gray-700 mt-auto">
            <button
                onClick={() => { setIsAdding(true); setEditingItem(null); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed"
                disabled={isAdding || !!editingItem}
            >
                <AddIcon className="h-5 w-5" />
                새 내역 추가
            </button>
        </div>
      </div>
    </div>
    );
}