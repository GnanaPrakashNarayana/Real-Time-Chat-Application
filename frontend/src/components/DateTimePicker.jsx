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
    setShowPicker(false); // Close picker after selection
  };
  
  // Set tomorrow morning
  const setTomorrowMorning = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setSelectedDate(tomorrow);
    onSelect(tomorrow);
    setShowPicker(false); // Close picker after selection
  };
  
  useEffect(() => {
    // Set default date to 30 minutes from now
    const defaultDate = new Date();
    defaultDate.setMinutes(defaultDate.getMinutes() + 30);
    setSelectedDate(defaultDate);
    onSelect(defaultDate);
  }, [onSelect]);
  
  return (
    <div className="relative w-full mt-3 mb-5">
      {/* Date display button */}
      <button 
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2.5 px-4 py-3 w-full bg-base-100 
                  border border-base-300 rounded-full hover:bg-base-200 
                  transition-colors text-left"
      >
        <Calendar className="size-5 text-primary" />
        <span className="font-medium">{formatDate(selectedDate)}</span>
      </button>
      
      {/* Date/time picker popover */}
      {showPicker && (
        <div className="absolute left-0 top-full mt-3 p-6 bg-base-100 rounded-2xl 
                       shadow-lg z-50 w-full border border-base-200">
          <div className="space-y-6">
            {/* Header */}
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              Schedule for
            </h3>
            
            {/* Quick options */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setQuickOption(30)}
                className="btn btn-outline border-base-300 rounded-full py-3 font-medium"
              >
                In 30 minutes
              </button>
              <button 
                type="button"
                onClick={() => setQuickOption(60)}
                className="btn btn-outline border-base-300 rounded-full py-3 font-medium"
              >
                In 1 hour
              </button>
              <button 
                type="button"
                onClick={() => setQuickOption(180)}
                className="btn btn-outline border-base-300 rounded-full py-3 font-medium"
              >
                In 3 hours
              </button>
              <button 
                type="button"
                onClick={setTomorrowMorning}
                className="btn btn-outline border-base-300 rounded-full py-3 font-medium"
              >
                Tomorrow 9 AM
              </button>
            </div>
            
            {/* Custom time picker */}
            <div className="space-y-2.5">
              <label className="font-medium block">Custom time</label>
              <input 
                type="datetime-local" 
                className="input input-bordered w-full rounded-xl px-4 py-3 h-auto" 
                value={formatDateForInput(selectedDate)}
                min={formatDateForInput(minDate)}
                onChange={handleDateChange}
              />
            </div>
            
            {/* Action button */}
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setShowPicker(false)}
                className="btn btn-primary rounded-full px-6"
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