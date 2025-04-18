// frontend/src/lib/safeSocket.js
/**
 * Helper utility to safely handle socket events to prevent "not a function" errors
 */

// Safe event emitter that validates function before calling
export const safeEmit = (socket, eventName, data) => {
    if (!socket) return false;
    
    try {
      if (typeof socket.emit === 'function') {
        socket.emit(eventName, data);
        return true;
      }
      console.warn(`Socket.emit is not a function for event: ${eventName}`);
      return false;
    } catch (error) {
      console.error(`Error emitting socket event ${eventName}:`, error);
      return false;
    }
  };
  
  // Add event listener with safety checks
  export const safeOn = (socket, eventName, callback) => {
    if (!socket) return false;
    
    try {
      if (typeof socket.on === 'function' && typeof callback === 'function') {
        socket.on(eventName, (...args) => {
          try {
            callback(...args);
          } catch (error) {
            console.error(`Error in socket ${eventName} callback:`, error);
          }
        });
        return true;
      }
      console.warn(`Cannot add listener for ${eventName} (socket.on not a function)`);
      return false;
    } catch (error) {
      console.error(`Error setting up socket listener for ${eventName}:`, error);
      return false;
    }
  };
  
  // Safe removal of event listener
  export const safeOff = (socket, eventName) => {
    if (!socket) return false;
    
    try {
      if (typeof socket.off === 'function') {
        socket.off(eventName);
        return true;
      }
      console.warn(`Socket.off is not a function for event: ${eventName}`);
      return false;
    } catch (error) {
      console.error(`Error removing socket event ${eventName}:`, error);
      return false;
    }
  };
  
  // Create safe wrapper for socket object
  export const createSafeSocket = (socket) => {
    if (!socket) return null;
    
    return {
      // Original socket reference
      _socket: socket,
      
      // Safe methods
      emit: (eventName, data) => safeEmit(socket, eventName, data),
      on: (eventName, callback) => safeOn(socket, eventName, callback),
      off: (eventName) => safeOff(socket, eventName),
      
      // Property accessors
      get connected() {
        return socket && socket.connected === true;
      },
      
      get id() {
        return socket && socket.id;
      },
  
      disconnect: () => {
        try {
          if (socket && typeof socket.disconnect === 'function') {
            socket.disconnect();
            return true;
          }
          return false;
        } catch (error) {
          console.error("Error disconnecting socket:", error);
          return false;
        }
      }
    };
  };