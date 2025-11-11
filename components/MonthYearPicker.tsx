import React, { useState, useRef, useEffect } from 'react';

interface MonthYearPickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  disableFutureDates?: boolean;
}

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const MONTHS_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ selectedDate, onChange, disableFutureDates = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedDate.getFullYear());
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(wrapperRef, () => setIsOpen(false));
  
  const handleMonthSelect = (monthIndex: number) => {
    onChange(new Date(pickerYear, monthIndex, 1));
    setIsOpen(false);
  };
  
  const changeYear = (offset: number) => {
    setPickerYear(prev => prev + offset);
  };
  
  const now = new Date();
  
  useEffect(() => {
    // When the picker is opened, reset the picker year to the currently selected year.
    if (isOpen) {
      setPickerYear(selectedDate.getFullYear());
    }
  }, [isOpen, selectedDate]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-lg font-bold text-white mx-4 w-48 text-center rounded-md px-3 py-1 hover:bg-gray-600 transition-colors"
        style={{minWidth: '12rem'}}
      >
        {selectedDate.toLocaleString('ko-KR', { month: 'long', year: 'numeric' })}
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => changeYear(-1)} className="p-2 rounded-full hover:bg-gray-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-lg font-bold text-white">{pickerYear}년</span>
            <button type="button" onClick={() => changeYear(1)} disabled={disableFutureDates && pickerYear >= now.getFullYear()} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MONTHS_KR.map((month, index) => {
              const isDisabled = disableFutureDates && pickerYear === now.getFullYear() && index > now.getMonth();
              const isSelected = pickerYear === selectedDate.getFullYear() && index === selectedDate.getMonth();
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleMonthSelect(index)}
                  disabled={isDisabled}
                  className={`py-2 px-1 text-sm rounded-md transition-colors ${
                    isSelected
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-gray-300 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};