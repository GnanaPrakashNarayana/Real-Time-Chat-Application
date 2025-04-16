// frontend/src/components/modals/GroupInfoModal.jsx
import { useState } from "react";
import { useGroupStore } from "../../store/useGroupStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { Users, UserPlus, LogOut, Trash, X } from "lucide-react";
import toast from "react-hot-toast";

const GroupInfoModal = ({ isOpen, onClose, group }) => {
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  const { authUser } = useAuthStore();
  const { users } = useChatStore();
  const { addGroupMembers, removeGroupMember } = useGroupStore();
  
  if (!isOpen || !group) return null;
  
  const isAdmin = group.admin._id === authUser._id;
  const nonMembers = users.filter(user => !group.members.some(member => member._id === user._id));
  
  const handleAddMembers = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    
    const success = await addGroupMembers(group._id, selectedMembers);
    if (success) {
      setSelectedMembers([]);
      setShowAddMembers(false);
    }
  };
  
  const handleRemoveMember = async (memberId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      await removeGroupMember(group._id, memberId);
    }
  };
  
  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      const success = await removeGroupMember(group._id, authUser._id);
      if (success) {
        onClose();
      }
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Group Info</h3>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <X className="size-5" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Group Details */}
          <div className="flex items-center gap-4 mb-6">
            <div className="avatar">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                {group.groupPic ? (
                  <img src={group.groupPic} alt={group.name} className="size-full rounded-full" />
                ) : (
                  <Users className="size-8 text-primary" />
                )}
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold">{group.name}</h4>
              <p className="text-sm text-base-content/70">
                Created by {group.admin.fullName}
                {group.admin._id === authUser._id && " (You)"}
              </p>
              {group.description && (
                <p className="mt-2 text-sm">{group.description}</p>
              )}
            </div>
          </div>
          
          {/* Members Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium flex items-center gap-2">
                <Users className="size-4" />
                Members ({group.members.length})
              </h5>
              
              {isAdmin && !showAddMembers && (
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="btn btn-ghost btn-sm gap-1"
                >
                  <UserPlus className="size-4" />
                  Add
                </button>
              )}
            </div>
            
            {/* Add Members UI */}
            {showAddMembers && (
              <div className="bg-base-200 rounded-lg p-3 mb-4">
                <h6 className="font-medium mb-2">Add New Members</h6>
                <div className="max-h-48 overflow-y-auto mb-3">
                  {nonMembers.length === 0 ? (
                    <p className="text-center py-2 text-sm text-base-content/60">No users available to add</p>
                  ) : (
                    nonMembers.map(user => (
                      <div 
                        key={user._id}
                        className="flex items-center gap-3 py-2 px-3 hover:bg-base-300 rounded-lg cursor-pointer"
                        onClick={() => {
                          if (selectedMembers.includes(user._id)) {
                            setSelectedMembers(prev => prev.filter(id => id !== user._id));
                          } else {
                            setSelectedMembers(prev => [...prev, user._id]);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(user._id)}
                          onChange={() => {}}
                          className="checkbox checkbox-sm"
                        />
                        <div className="avatar">
                          <div className="size-8 rounded-full">
                            <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                          </div>
                        </div>
                        <span className="font-medium">{user.fullName}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setShowAddMembers(false);
                      setSelectedMembers([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleAddMembers}
                    disabled={selectedMembers.length === 0}
                  >
                    Add Selected
                  </button>
                </div>
              </div>
            )}
            
            {/* Members List */}
            <div className="max-h-64 overflow-y-auto bg-base-200 rounded-lg">
              {group.members.map(member => (
                <div 
                  key={member._id}
                  className="flex items-center justify-between py-3 px-4 hover:bg-base-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="size-10 rounded-full">
                        <img src={member.profilePic || "/avatar.png"} alt={member.fullName} />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.fullName}
                        {member._id === authUser._id && " (You)"}
                      </p>
                      {member._id === group.admin._id && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Remove Member (Admin only, can't remove admin) */}
                  {isAdmin && member._id !== authUser._id && (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      className="btn btn-ghost btn-circle btn-sm text-red-500"
                      title="Remove member"
                    >
                      <Trash className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Leave Group Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleLeaveGroup}
              className="btn btn-outline btn-error gap-2"
            >
              <LogOut className="size-4" />
              {isAdmin ? "Leave & Delete Group" : "Leave Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;