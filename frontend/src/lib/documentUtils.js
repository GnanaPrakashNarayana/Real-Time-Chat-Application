// frontend/src/lib/documentUtils.js
// Create this new file

/**
 * Safely reads a file as Data URL
 * @param {File|null} file - File object to read
 * @returns {Promise<string|null>} Data URL or null
 */
export const readFileAsDataURL = (file) => {
    if (!file || !(file instanceof File)) {
      console.warn('Invalid file object provided to readFileAsDataURL');
      return Promise.resolve(null);
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };
  
  /**
   * Creates a safe document object for temporary display
   * @param {Object|null} documentData - Document data
   * @returns {Object|null} Safe document object
   */
  export const createSafeDocumentObject = (documentData) => {
    if (!documentData) return null;
    
    try {
      return {
        name: documentData.name || 'Document',
        type: documentData.type || 'application/octet-stream',
        size: documentData.size || 0,
        url: documentData.url || '',
      };
    } catch (error) {
      console.error('Error creating safe document object:', error);
      return null;
    }
  };
  
  /**
   * Creates document data from file for sending to server
   * @param {Object} fileData - File data object
   * @returns {Promise<Object|null>} Document data for API
   */
  export const prepareDocumentForUpload = async (fileData) => {
    if (!fileData || !fileData.file) {
      console.warn('Invalid file data provided to prepareDocumentForUpload');
      return null;
    }
    
    try {
      const dataUrl = await readFileAsDataURL(fileData.file);
      
      return {
        data: dataUrl,
        name: fileData.name || fileData.file.name || 'Document',
        type: fileData.type || fileData.file.type || 'application/octet-stream',
        size: fileData.size || fileData.file.size || 0
      };
    } catch (error) {
      console.error('Error preparing document for upload:', error);
      return null;
    }
  };