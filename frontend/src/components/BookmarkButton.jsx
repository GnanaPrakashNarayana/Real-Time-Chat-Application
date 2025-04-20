// frontend/src/components/BookmarkButton.jsx
import { useState } from "react";
import { useBookmarkStore } from "../store/useBookmarkStore";
import { Bookmark, X, Check } from "lucide-react";

const BookmarkButton = ({ 
  message, 
  conversationId, 
  conversationType,
  showBookmarked = false, // If true, will only show icon if message is bookmarked
  small = false // For a smaller button version
}) => {
  const { addBookmark, removeBookmark, renameBookmark, isMessageBookmarked, getBookmarkByMessageId } = useBookmarkStore();
  const [isEditing, setIsEditing] = useState(false);
  const [bookmarkName, setBookmarkName] = useState("");
  
  const isBookmarked = isMessageBookmarked(message._id);
  const bookmark = getBookmarkByMessageId(message._id);
  
  // Don't render anything if showBookmarked is true and the message isn't bookmarked
  if (showBookmarked && !isBookmarked) {
    return null;
  }
  
  // Toggle bookmark
  const handleToggleBookmark = async () => {
    if (isBookmarked && bookmark) {
      await removeBookmark(bookmark._id);
    } else {
      const bookmarkData = {
        messageId: message._id,
        messageType: conversationType === 'Group' ? 'GroupMessage' : 'Message',
        conversationId: conversationId,
        conversationType: conversationType,
        name: "" // Default empty name
      };
      
      const newBookmark = await addBookmark(bookmarkData);
      if (newBookmark) {
        setIsEditing(true);
        setBookmarkName("");
      }
    }
  };
  
  // Save bookmark name
  const handleSaveBookmarkName = async () => {
    if (!bookmark) return;
    
    if (bookmarkName.trim()) {
      await renameBookmark(bookmark._id, bookmarkName);
    }
    
    setIsEditing(false);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setBookmarkName("");
  };
  
  // Keyboard handling for the input field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveBookmarkName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  
  // If in editing mode, show input field
  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[120px]">
        <input
          type="text"
          className="input input-bordered input-sm flex-1 min-w-0"
          placeholder="Bookmark label"
          value={bookmarkName}
          onChange={(e) => setBookmarkName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button 
          className="btn btn-ghost btn-circle btn-xs"
          onClick={handleSaveBookmarkName}
          title="Save bookmark name"
        >
          <Check className="size-3.5" />
        </button>
        <button 
          className="btn btn-ghost btn-circle btn-xs"
          onClick={handleCancelEdit}
          title="Cancel"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }
  
  // If already bookmarked and showing the bookmarked icon
  if (isBookmarked && bookmark && showBookmarked) {
    return (
      <div className="flex items-center gap-1">
        <Bookmark className={`${small ? 'size-3.5' : 'size-4'} text-primary fill-primary`} />
        {bookmark.name && <span className="text-xs">{bookmark.name}</span>}
      </div>
    );
  }
  
  // Regular bookmark button
  return (
    <button
      className={`btn btn-ghost ${small ? 'btn-xs' : 'btn-sm'} btn-circle`}
      onClick={handleToggleBookmark}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this message"}
    >
      <Bookmark className={`${small ? 'size-3.5' : 'size-4'} ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
    </button>
  );
};

export default BookmarkButton;