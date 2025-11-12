import React, { useState, useMemo } from 'react';
import { Contact } from '../types.ts';
import { ContactIcon, PhoneIcon, EmailIcon, AddIcon, EditIcon, DeleteIcon, SaveIcon, CopyIcon, CheckIcon } from './icons.tsx';

// Props for the entire list component
interface ContactsListProps {
  contacts: Contact[];
  onAdd?: (contact: Omit<Contact, 'id'>) => void;
  onUpdate?: (contact: Contact) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

// Props for the form used for adding/editing
interface ContactFormProps {
    contact?: Contact; // Optional: if provided, it's an edit form
    onSave: (contact: Contact | Omit<Contact, 'id'>) => void;
    onCancel: () => void;
    allGroupNames: string[];
}

const ContactForm: React.FC<ContactFormProps> = ({ contact, onSave, onCancel, allGroupNames }) => {
    const [name, setName] = useState(contact?.name || '');
    const [phone, setPhone] = useState(contact?.phone || '');
    const [email, setEmail] = useState(contact?.email || '');
    const [group, setGroup] = useState(contact?.group || '기타');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return; // Name is required
        onSave({
            ...(contact || {}), // spread existing contact to keep id if editing
            name,
            phone,
            email,
            group: group.trim() || '기타',
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-3 bg-gray-700 rounded-lg space-y-3">
            <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                  type="tel"
                  placeholder="전화번호"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
               <input
                    type="text"
                    list="group-suggestions"
                    placeholder="그룹"
                    value={group}
                    onChange={e => setGroup(e.target.value)}
                    className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <datalist id="group-suggestions">
                    {allGroupNames.map(g => <option key={g} value={g} />)}
                </datalist>
            </div>
            <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
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


export const ContactsList: React.FC<ContactsListProps> = ({ contacts, onAdd, onUpdate, onDelete, readOnly = false }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'newest' | 'oldest'>('name-asc');
    
    const allGroupNames = useMemo(() => 
        // FIX: Explicitly type `a` and `b` as strings to resolve TypeScript inference error.
        Array.from(new Set(contacts.map(c => c.group || '기타'))).sort((a: string, b: string) => a.localeCompare(b))
    , [contacts]);
    
    const sortedContacts = useMemo(() => {
        // New contacts are added to the front, so the original array is newest first.
        const contactsCopy = [...contacts];
        switch (sortOrder) {
            case 'name-asc':
                return contactsCopy.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
            case 'name-desc':
                return contactsCopy.sort((a, b) => b.name.localeCompare(a.name, 'ko'));
            case 'newest':
                return contacts; // Original order is newest first.
            case 'oldest':
                return [...contacts].reverse(); // A reversed copy for oldest first.
            default:
                return contacts;
        }
    }, [contacts, sortOrder]);

    const groupedContacts = useMemo(() => {
        return sortedContacts.reduce((acc, contact) => {
            const groupName = contact.group || '기타';
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(contact);
            return acc;
        }, {} as Record<string, Contact[]>);
    }, [sortedContacts]);

    const sortedGroupNames = useMemo(() => {
        return Object.keys(groupedContacts).sort((a, b) => {
            if (a === '기타') return 1;
            if (b === '기타') return -1;
            return a.localeCompare(b);
        });
    }, [groupedContacts]);

    const handleCopyPhone = (phone: string) => {
        navigator.clipboard.writeText(phone).then(() => {
            setCopiedPhone(phone);
            setTimeout(() => setCopiedPhone(null), 2000); // Reset after 2 seconds
        });
    };

    const handleSaveNew = (contact: Omit<Contact, 'id'>) => {
        onAdd?.(contact);
        setIsAdding(false);
    };

    const handleSaveUpdate = (contact: Contact) => {
        onUpdate?.(contact);
        setEditingId(null);
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('이 연락처를 삭제하시겠습니까?')) {
            onDelete?.(id);
        }
    };

    const contactsHeader = (
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-300">
                    <ContactIcon className="h-6 w-6" />
                    연락처
                </h3>
                {!readOnly && contacts.length > 0 && (
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'name-asc' | 'name-desc' | 'newest' | 'oldest')}
                        className="bg-gray-700 text-white text-sm rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        aria-label="연락처 정렬"
                    >
                        <option value="name-asc">이름 오름차순</option>
                        <option value="name-desc">이름 내림차순</option>
                        <option value="newest">최신순</option>
                        <option value="oldest">오래된순</option>
                    </select>
                )}
            </div>
            {!readOnly && (
                <button 
                    onClick={() => { setIsAdding(true); setEditingId(null); }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white rounded-md text-sm hover:bg-cyan-700 disabled:bg-cyan-800"
                    disabled={isAdding || !!editingId}
                >
                    <AddIcon className="h-4 w-4" />
                    추가
                </button>
            )}
        </div>
    );

    if (contacts.length === 0 && !isAdding) {
      return (
        <section>
             {contactsHeader}
             <div className="space-y-3">
                {!readOnly && isAdding && <ContactForm onSave={handleSaveNew} onCancel={() => setIsAdding(false)} allGroupNames={allGroupNames} />}
                <div className="text-center py-10 text-gray-500">
                    <p>저장된 연락처가 없습니다.</p>
                    {!readOnly && <p className="text-sm mt-1">'추가' 버튼을 눌러 새 연락처를 등록하세요.</p>}
                </div>
            </div>
        </section>
      )
    }

    return (
        <section>
            {contactsHeader}
            <div className="space-y-4">
                {!readOnly && isAdding && <ContactForm onSave={handleSaveNew} onCancel={() => setIsAdding(false)} allGroupNames={allGroupNames} />}
                
                {sortedGroupNames.map((groupName) => (
                    <div key={groupName}>
                         <h4 className="text-sm font-bold uppercase text-gray-400 mb-2 px-1 tracking-wider">{groupName}</h4>
                         <div className="space-y-3">
                            {groupedContacts[groupName]
                                .map((contact) => (
                                editingId === contact.id && !readOnly ? (
                                    <ContactForm 
                                        key={contact.id} 
                                        contact={contact} 
                                        onSave={(c) => handleSaveUpdate(c as Contact)} 
                                        onCancel={() => setEditingId(null)}
                                        allGroupNames={allGroupNames}
                                    />
                                ) : (
                                <div key={contact.id} className="p-3 bg-gray-700/50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-white">{contact.name}</p>
                                            {contact.phone && (
                                                <div className="text-sm text-gray-300 flex items-center gap-2 mt-1">
                                                    <PhoneIcon className="h-4 w-4" />
                                                    <span>{contact.phone}</span>
                                                    <button onClick={() => handleCopyPhone(contact.phone!)} className="text-gray-400 hover:text-white">
                                                        {copiedPhone === contact.phone ? <CheckIcon className="h-4 w-4 text-green-400" /> : <CopyIcon className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            )}
                                            {contact.email && (
                                            <p className="text-sm text-gray-300 flex items-center gap-2 mt-1">
                                                <EmailIcon className="h-4 w-4" />
                                                {contact.email}
                                            </p>
                                            )}
                                        </div>
                                        {!readOnly && (
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingId(contact.id); setIsAdding(false); }} className="p-1 text-gray-400 hover:text-cyan-400" disabled={isAdding || !!editingId}>
                                                    <EditIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => handleDelete(contact.id)} className="p-1 text-gray-400 hover:text-red-400">
                                                    <DeleteIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                )
                            ))}
                         </div>
                    </div>
                ))}
            </div>
        </section>
    );
};