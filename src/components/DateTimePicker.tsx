import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface DateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm
  onChange: (val: string) => void;
  required?: boolean;
}

export default function DateTimePicker({ value, onChange, required }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the current value, or default to a reasonable tomorrow or current date
  const parseValue = (val: string): Date => {
    if (!val) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      return tomorrow;
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const selectedDate = parseValue(value);

  // Calendar navigation state (independent of selected date)
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth()); // 0-indexed

  // Sync navigation view when selected date changes (e.g. from preset)
  useEffect(() => {
    if (value) {
      const d = parseValue(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date helper for the display trigger
  const formatDisplay = (val: string) => {
    if (!val) return 'Select deadline...';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format to standard input value YYYY-MM-DDTHH:mm
  const toDateTimeString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper for generating calendar grid days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 is Sunday
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Generate complete days list (padding previous month trailing days and next month leading days)
  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
  const prevMonthDays = getDaysInMonth(prevYear, prevMonth);

  const daysGrid: Array<{ date: Date; isCurrentMonth: boolean; key: string }> = [];

  // Trailing days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(prevYear, prevMonth, prevMonthDays - i, selectedDate.getHours(), selectedDate.getMinutes());
    daysGrid.push({
      date: d,
      isCurrentMonth: false,
      key: `prev-${prevMonthDays - i}`
    });
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(viewYear, viewMonth, i, selectedDate.getHours(), selectedDate.getMinutes());
    daysGrid.push({
      date: d,
      isCurrentMonth: true,
      key: `curr-${i}`
    });
  }

  // Next month leading days to fill grid (multiple of 7, let's do up to 42 cells)
  const totalCells = 42;
  const nextMonthDaysNeeded = totalCells - daysGrid.length;
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  for (let i = 1; i <= nextMonthDaysNeeded; i++) {
    const d = new Date(nextYear, nextMonth, i, selectedDate.getHours(), selectedDate.getMinutes());
    daysGrid.push({
      date: d,
      isCurrentMonth: false,
      key: `next-${i}`
    });
  }

  // Month names list
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Quick preset helper
  const applyPreset = (hoursFromNow: number) => {
    const target = new Date();
    target.setHours(target.getHours() + hoursFromNow);
    // Round to nearest 5 minutes
    const minutes = target.getMinutes();
    const roundedMinutes = Math.round(minutes / 5) * 5;
    target.setMinutes(roundedMinutes, 0, 0);
    onChange(toDateTimeString(target));
  };

  const applyTomorrowPreset = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0); // 5 PM tomorrow preset
    onChange(toDateTimeString(tomorrow));
  };

  const applyIn3DaysPreset = () => {
    const target = new Date();
    target.setDate(target.getDate() + 3);
    target.setHours(17, 0, 0, 0); // 5 PM in 3 days
    onChange(toDateTimeString(target));
  };

  // Handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleDateSelect = (date: Date) => {
    // Preserve current hours and minutes
    const currentHours = selectedDate.getHours();
    const currentMinutes = selectedDate.getMinutes();
    const target = new Date(date);
    target.setHours(currentHours, currentMinutes, 0, 0);
    onChange(toDateTimeString(target));
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const h = parseInt(e.target.value);
    const target = new Date(selectedDate);
    target.setHours(h);
    onChange(toDateTimeString(target));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value);
    const target = new Date(selectedDate);
    target.setMinutes(m);
    onChange(toDateTimeString(target));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!value) return false;
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button that mimics standard input field */}
      <button
        type="button"
        id="deadline-custom-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0F0F0F] border border-white/10 rounded p-2 text-sm text-white focus:outline-none focus:border-[#FF3B30] font-mono cursor-pointer transition-all"
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>
          {formatDisplay(value)}
        </span>
        <CalendarIcon className="w-3.5 h-3.5 text-slate-400 ml-2 shrink-0" />
      </button>

      {/* Embedded hidden input so standard HTML form validation works if required */}
      <input
        type="hidden"
        name="deadline"
        required={required}
        value={value}
        readOnly
      />

      {isOpen && (
        <div className="absolute left-0 mt-1 w-[320px] bg-[#0F0F0F] border border-white/15 rounded-lg shadow-2xl p-4 z-[999] select-none font-sans">
          {/* Presets Header */}
          <div className="mb-3">
            <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-mono mb-1.5">Presets</span>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => applyPreset(4)}
                className="bg-[#141414] hover:bg-white/5 border border-white/5 rounded text-[10px] py-1 text-white font-mono"
              >
                +4 Hrs
              </button>
              <button
                type="button"
                onClick={() => applyPreset(12)}
                className="bg-[#141414] hover:bg-white/5 border border-white/5 rounded text-[10px] py-1 text-white font-mono"
              >
                +12 Hrs
              </button>
              <button
                type="button"
                onClick={applyTomorrowPreset}
                className="bg-[#141414] hover:bg-white/5 border border-white/5 rounded text-[10px] py-1 text-white font-mono"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={applyIn3DaysPreset}
                className="bg-[#141414] hover:bg-white/5 border border-white/5 rounded text-[10px] py-1 text-white font-mono"
              >
                +3 Days
              </button>
            </div>
          </div>

          <div className="border-t border-white/5 my-2"></div>

          {/* Month Selector */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono uppercase tracking-widest text-white font-bold">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day} className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {daysGrid.map(({ date, isCurrentMonth, key }) => {
              const active = isSelected(date);
              const today = isToday(date);
              
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`
                    text-xs py-1.5 rounded font-mono transition-all relative
                    ${isCurrentMonth ? 'text-white' : 'text-slate-600'}
                    ${active ? 'bg-[#FF3B30] text-white font-bold shadow-[0_2px_8px_rgba(255,59,48,0.4)]' : 'hover:bg-white/5'}
                    ${today && !active ? 'border border-white/20' : ''}
                  `}
                >
                  {date.getDate()}
                  {today && !active && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/5 my-2"></div>

          {/* Time Picker Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center text-slate-400 gap-1 text-[10px] font-mono uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Time Setter</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Hour Select */}
              <select
                value={selectedDate.getHours()}
                onChange={handleHourChange}
                className="bg-[#141414] border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF3B30]"
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const label = String(i).padStart(2, '0');
                  const ampm = i >= 12 ? 'PM' : 'AM';
                  const hour12 = i % 12 === 0 ? 12 : i % 12;
                  return (
                    <option key={i} value={i}>
                      {label} ({hour12} {ampm})
                    </option>
                  );
                })}
              </select>

              <span className="text-slate-500 font-mono text-xs">:</span>

              {/* Minute Select */}
              <select
                value={selectedDate.getMinutes()}
                onChange={handleMinuteChange}
                className="bg-[#141414] border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-[#FF3B30]"
              >
                {Array.from({ length: 60 }).map((_, i) => {
                  const label = String(i).padStart(2, '0');
                  return (
                    <option key={i} value={i}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Done/Close Button */}
          <div className="mt-3.5 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-white hover:bg-slate-200 text-black font-black uppercase text-[10px] tracking-wider px-3 py-1.5 rounded transition-all"
            >
              Set Deadline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
