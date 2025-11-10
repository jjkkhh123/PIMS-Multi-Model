import React, { useState } from 'react';
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
}

const ContactForm: React.FC<ContactFormProps> = ({ contact, onSave, onCancel }) => {
    const [name, setName] = useState(contact?.name || '');
    const [phone, setPhone] = useState(contact?.phone || '');
    const [email, setEmail] = useState(contact?.email || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return; // Name is required
        onSave({
            ...(contact || {}), // spread existing contact to keep id if editing
            name,
            phone,
            email,
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
            <input
                type="tel"
                placeholder="전화번호"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2 bg-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
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

    if (contacts.length === 0 && !isAdding) {
      return (
        <section>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-300">
                    <ContactIcon className="h-6 w-6" />
                    연락처
                </h3>
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
             <div className="space-y-3">
                {!readOnly && isAdding && <ContactForm onSave={handleSaveNew} onCancel={() => setIsAdding(false)} />}
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
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-300">
                    <ContactIcon className="h-6 w-6" />
                    연락처
                </h3>
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

            <div className="space-y-3">
                {!readOnly && isAdding && <ContactForm onSave={handleSaveNew} onCancel={() => setIsAdding(false)} />}
                
                {contacts.map((contact) => (
                    editingId === contact.id && !readOnly ? (
                        <ContactForm 
                            key={contact.id} 
                            contact={contact} 
                            onSave={(c) => handleSaveUpdate(c as Contact)} 
                            onCancel={() => setEditingId(null)} 
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
        </section>
    );
};