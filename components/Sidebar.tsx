import React, { useState, useEffect } from 'react';
import { View } from '../types';
import { HomeIcon, CalendarIcon, ExpenseIcon, ContactIcon, DiaryIcon, HistoryIcon, AppIcon, ChevronRightIcon, TransactionIcon, StatsIcon } from './icons';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

// A recursive type definition for menu items to satisfy TypeScript
type MenuItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: React.FC<React.SVGProps<SVGSVGElement>>;
  readonly subItems?: readonly MenuItem[];
};


const menuItems: readonly MenuItem[] = [
  { id: 'ALL', label: '메인 화면', icon: HomeIcon },
  { id: 'HISTORY', label: '처리 내역', icon: HistoryIcon },
  {
    id: 'APP_GROUP',
    label: '앱',
    icon: AppIcon,
    subItems: [
      { id: 'CALENDAR', label: '캘린더', icon: CalendarIcon },
      {
        id: 'EXPENSES_GROUP',
        label: '가계부',
        icon: ExpenseIcon,
        subItems: [
          { id: 'EXPENSES_DASHBOARD', label: '대시보드', icon: AppIcon },
          { id: 'EXPENSES_INCOME', label: '수입 내역', icon: TransactionIcon },
          { id: 'EXPENSES_EXPENSE', label: '지출 내역', icon: TransactionIcon },
          { id: 'EXPENSES_STATS', label: '통계', icon: StatsIcon },
        ],
      },
      { id: 'CONTACTS', label: '연락처', icon: ContactIcon },
    ],
  },
  { id: 'DIARY', label: '기타 메모', icon: DiaryIcon },
];


export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const findParent = (items: readonly MenuItem[], childId: View): MenuItem | undefined => {
    for (const item of items) {
        if (item.subItems?.some(sub => sub.id === childId)) {
            return item;
        }
        if (item.subItems) {
            const parent = findParent(item.subItems, childId);
            if (parent) return parent;
        }
    }
    return undefined;
  };

  const getParentIds = (startId: View) => {
    const parents: string[] = [];
    let currentParent = findParent(menuItems, startId);
    while (currentParent) {
      parents.push(currentParent.id);
      currentParent = findParent(menuItems, currentParent.id as View);
    }
    return parents;
  };
  
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    const parentIds = getParentIds(activeView);
    parentIds.forEach(id => {
      initialState[id] = true;
    });
    return initialState;
  });

  useEffect(() => {
    const parentIds = getParentIds(activeView);
    const newOpenMenus = { ...openMenus };
    let changed = false;
    parentIds.forEach(id => {
      if (!newOpenMenus[id]) {
        newOpenMenus[id] = true;
        changed = true;
      }
    });
    if (changed) {
      setOpenMenus(newOpenMenus);
    }
  }, [activeView]);

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMenuItems = (items: readonly MenuItem[], level = 0) => {
    return items.map(item => {
      if (item.subItems) {
        const isMenuOpen = !!openMenus[item.id];
        const isMenuActive = item.subItems.some(sub => sub.id === activeView || sub.subItems?.some(subsub => subsub.id === activeView));
        
        return (
          <div key={item.id}>
            <button
              onClick={() => toggleMenu(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left ${
                isMenuActive && !isMenuOpen
                  ? 'bg-gray-700/80 text-white'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
              style={{ paddingLeft: `${0.75 + level * 1.25}rem` }}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
              <ChevronRightIcon className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-90' : ''}`} />
            </button>
            {isMenuOpen && (
              <div className="mt-1 flex flex-col gap-1">
                {renderMenuItems(item.subItems, level + 1)}
              </div>
            )}
          </div>
        );
      } else {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={`w-full flex items-center gap-3 py-2 px-3 rounded-md text-sm font-medium transition-colors text-left ${
              isActive
                ? 'bg-cyan-600 text-white'
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
             style={{ paddingLeft: `${0.75 + level * 1.25}rem` }}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        );
      }
    });
  };


  return (
    <aside className="w-64 bg-gray-900/50 p-4 flex flex-col flex-shrink-0">
      <div className="px-2 mb-8">
        <h1 className="text-3xl font-bold text-white">LifeOS</h1>
      </div>
      <nav className="flex flex-col gap-1">
        {renderMenuItems(menuItems)}
      </nav>
    </aside>
  );
};