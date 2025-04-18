// frontend/src/lib/debounce.js
/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @return {Function} - The debounced function
 */
export const debounce = (func, wait) => {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  /**
   * Create a debounced state setter
   * @param {Function} setState - React setState function
   * @param {number} delay - Delay in milliseconds
   * @return {Function} - Debounced setState function
   */
  export const debouncedSetState = (setState, delay = 300) => {
    return debounce(setState, delay);
  };