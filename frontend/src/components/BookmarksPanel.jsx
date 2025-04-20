// frontend/src/components/BookmarksPanel.jsx
import { useEffect, useState } from "react";
import { useBookmarkStore } from "../store/useBookmarkStore";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { formatMessageTime } from "../lib/utils";
import { Bookmark, ChevronRight, Pencil, Trash, User, Users, X } from "lucide-react";

const BookmarksPanel = ({ isOpen, onClose }) => {
  const { bookmarks, getBookmarks, isLoadingBookmarks, removeBookmark, renameBookmark } = useBookmarkStore();
  const { setSelectedUser } = useChatStore();
  const { setSelectedGroup } = useGroupStore();
  const [editBookmarkId, setEditBookmarkId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (isOpen) {
      getBookmarks();
    }
  }, [isOpen, getBookmarks]);

  // Handle bookmark click to navigate to the message
  const handleBookmarkClick = (bookmark) => {
    if (!bookmark) return;
    
    // Navigate to the appropriate conversation
    if (bookmark.conversationType === 'User') {
      setSelectedUser({
        _id: bookmark.conversationId,
        ...bookmark.conversation
      });
      setSelectedGroup(null);
    } else if (bookmark.conversationType === 'Group') {
      setSelectedGroup({
        _id: bookmark.conversationId,
        ...bookmark.conversation
      });
      setSelectedUser(null);
    }
    
    // Allow time for conversation to load before scrolling
    setTimeout(() => {
      // Scroll to the message
      const messageEl = document.getElementById(`message-${bookmark.messageId}`);
      if (messageEl) {
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageEl.classList.add('highlight-message');
        
        // Remove highlight after animation
        setTimeout(() => {
          messageEl.classList.remove('highlight-message');
        }, 2000);
      }
    }, 500);
    
    onClose();
  };

  // Start editing bookmark name
  const handleEditClick = (bookmark, e) => {
    e.stopPropagation();
    setEditBookmarkId(bookmark._id);
    setEditName(bookmark.name || '');
  };

  // Save updated bookmark name
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editBookmarkId) return;
    
    await renameBookmark(editBookmarkId, editName);
    setEditBookmarkId(null);
    setEditName("");
  };

  // Delete bookmark
  const handleDeleteClick = async (bookmarkId, e) => {
    e.stopPropagation();
    await removeBookmark(bookmarkId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25">
      <div className="bg-base-100 w-full max-w-md h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-base-100 z-10 flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bookmark className="size-5" />
            Bookmarks
          </h2>
          <button 
            className="btn btn-ghost btn-circle btn-sm"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>
        
        <div className="p-4">
          {isLoadingBookmarks ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              <Bookmark className="size-6 mx-auto mb-2 opacity-50" />
              <p>No bookmarks yet</p>
              <p className="text-sm mt-2">
                Click the bookmark icon on any message to save it for later
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div 
                  key={bookmark._id}
                  className="bg-base-200 rounded-lg p-3 cursor-pointer hover:bg-base-300 transition-colors"
                  onClick={() => handleBookmarkClick(bookmark)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {bookmark.conversationType === 'User' ? (
                        <div className="flex items-center gap-1.5">
                          <User className="size-3.5" />
                          <span className="text-sm font-medium">
                            {bookmark.conversation?.fullName || "User"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Users className="size-3.5" />
                          <span className="text-sm font-medium">
                            {bookmark.conversation?.name || "Group"}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-base-content/60">
                        {formatMessageTime(bookmark.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <button 
                        className="btn btn-ghost btn-xs btn-circle"
                        onClick={(e) => handleEditClick(bookmark, e)}
                        title="Edit bookmark name"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button 
                        className="btn btn-ghost btn-xs btn-circle text-error"
                        onClick={(e) => handleDeleteClick(bookmark._id, e)}
                        title="Delete bookmark"
                      >
                        <Trash className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {editBookmarkId === bookmark._id ? (
                    <form onSubmit={handleSaveEdit} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Save
                      </button>
                    </form>
                  ) : bookmark.name ? (
                    <div className="mb-1 font-medium text-primary flex items-center gap-1">
                      <Bookmark className="size-3.5 fill-primary" />
                      {bookmark.name}
                    </div>
                  ) : null}
                  
                  <div className="text-sm truncate">
                    {bookmark.message?.text || 
                     (bookmark.message?.image ? "📷 Image" : "") ||
                     (bookmark.message?.document ? "📄 Document" : "") ||
                     (bookmark.message?.voiceMessage ? "🎤 Voice message" : "") ||
                     "Message content unavailable"}
                  </div>
                  
                  <div className="flex items-center justify-end mt-1">
                    <ChevronRight className="size-4 text-base-content/40" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarksPanel;