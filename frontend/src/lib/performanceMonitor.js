// frontend/src/lib/performanceMonitor.js

/**
 * Simple utility to monitor performance issues
 */

// Track render counts to detect potential infinite loops
const renderCounts = {};

// Track time spent in functions to detect potential bottlenecks
const functionTimes = {};

/**
 * Track component renders
 * @param {string} componentName - Name of the component being rendered
 */
export const trackRender = (componentName) => {
  if (!renderCounts[componentName]) {
    renderCounts[componentName] = 0;
  }
  
  renderCounts[componentName]++;
  
  // Warning if component renders too many times
  if (renderCounts[componentName] % 20 === 0) {
    console.warn(`${componentName} has rendered ${renderCounts[componentName]} times. Possible performance issue.`);
  }
};

/**
 * Track function execution time
 * @param {string} functionName - Name of the function being timed
 * @param {Function} fn - Function to time
 * @param {Array} args - Arguments to pass to function
 */
export const timeFunction = async (functionName, fn, ...args) => {
  const start = performance.now();
  try {
    const result = await fn(...args);
    const end = performance.now();
    const duration = end - start;
    
    // Track times
    if (!functionTimes[functionName]) {
      functionTimes[functionName] = [];
    }
    
    functionTimes[functionName].push(duration);
    
    // Warning if function takes too long
    if (duration > 500) {
      console.warn(`${functionName} took ${duration.toFixed(2)}ms to execute. Possible performance issue.`);
    }
    
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`${functionName} failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
};

/**
 * Check for memory leaks
 */
export const checkMemoryUsage = () => {
  if (window.performance && window.performance.memory) {
    const memory = window.performance.memory;
    const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    
    if (memoryUsage > 0.7) {
      console.warn(`Memory usage is high: ${(memoryUsage * 100).toFixed(2)}% of available heap used.`);
    }
    
    return memoryUsage;
  }
  
  return null;
};

/**
 * Reset tracking
 */
export const resetTracking = () => {
  Object.keys(renderCounts).forEach(key => {
    renderCounts[key] = 0;
  });
  
  Object.keys(functionTimes).forEach(key => {
    functionTimes[key] = [];
  });
};

// Set up interval to check memory usage
let memoryCheckInterval = null;

export const startMemoryMonitoring = (intervalMs = 10000) => {
  if (memoryCheckInterval) {
    clearInterval(memoryCheckInterval);
  }
  
  memoryCheckInterval = setInterval(() => {
    checkMemoryUsage();
  }, intervalMs);
};

export const stopMemoryMonitoring = () => {
  if (memoryCheckInterval) {
    clearInterval(memoryCheckInterval);
    memoryCheckInterval = null;
  }
};