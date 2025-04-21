// frontend/src/components/DateTimePicker.jsx
import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

const DateTimePicker = ({ onSelect, minDate = new Date() }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  
  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Format date for input value
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // Handle date change
  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    onSelect(newDate);
  };
  
  // Handle quick options
  const setQuickOption = (minutes) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    setSelectedDate(date);
    onSelect(date);
  };
  
  useEffect(() => {
    // Set default date to 30 minutes from now
    const defaultDate = new Date();
    defaultDate.setMinutes(defaultDate.getMinutes() + 30);
    setSelectedDate(defaultDate);
    onSelect(defaultDate);
  }, [onSelect]);
  
  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="btn btn-sm btn-outline flex items-center gap-2"
      >
        <Calendar className="size-4" />
        <span>{formatDate(selectedDate)}</span>
      </button>
      
      {showPicker && (
        <div className="absolute left-0 top-full mt-2 p-4 bg-base-200 rounded-lg shadow-lg z-50 w-[300px]">
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="size-4" />
              Schedule for
            </h3>
            
            {/* Quick options */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button"
                onClick={() => setQuickOption(30)}
                className="btn btn-sm btn-outline"
              >
                In 30 minutes
              </button>
              <button 
                type="button"
                onClick={() => setQuickOption(60)}
                className="btn btn-sm btn-outline"
              >
                In 1 hour
              </button>
              <button 
                type="button"
                onClick={() => setQuickOption(180)}
                className="btn btn-sm btn-outline"
              >
                In 3 hours
              </button>
              <button 
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  setSelectedDate(tomorrow);
                  onSelect(tomorrow);
                }}
                className="btn btn-sm btn-outline"
              >
                Tomorrow 9 AM
              </button>
            </div>
            
            {/* Date time picker */}
            <div>
              <label className="label">
                <span className="label-text">Custom time</span>
              </label>
              <input 
                type="datetime-local" 
                className="input input-bordered w-full" 
                value={formatDateForInput(selectedDate)}
                min={formatDateForInput(minDate)}
                onChange={handleDateChange}
              />
            </div>
            
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setShowPicker(false)}
                className="btn btn-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;