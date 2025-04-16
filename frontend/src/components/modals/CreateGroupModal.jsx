// frontend/src/components/modals/CreateGroupModal.jsx
import { useState, useRef } from "react";
import { useGroupStore } from "../../store/useGroupStore";
import { useChatStore } from "../../store/useChatStore";
import { Camera, X } from "lucide-react";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    groupPic: null,
  });
  
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [previewPic, setPreviewPic] = useState(null);
  const fileInputRef = useRef(null);
  
  const { createGroup, isCreatingGroup } = useGroupStore();
  const { users } = useChatStore();
  
  if (!isOpen) return null;
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPic(reader.result);
      setFormData(prev => ({ ...prev, groupPic: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  
  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedMembers(prev => [...prev, userId]);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    
    const groupData = {
      ...formData,
      members: selectedMembers,
    };
    
    const success = await createGroup(groupData);
    if (success) {
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Create New Group</h3>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <X className="size-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Group Picture */}
          <div className="flex justify-center">
            <div className="relative">
              <div 
                className="size-24 rounded-full border-2 border-base-300 bg-base-200 flex items-center justify-center overflow-hidden"
              >
                {previewPic ? (
                  <img src={previewPic} alt="Group" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-3xl text-base-content/40">G</span>
                )}
              </div>
              <label 
                className="absolute bottom-0 right-0 bg-primary text-primary-content rounded-full p-2 cursor-pointer"
                htmlFor="group-picture-upload"
              >
                <Camera className="size-5" />
                <input 
                  type="file"
                  id="group-picture-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>
          
          {/* Group Details */}
          <div className="space-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Group Name</span>
              </label>
              <input 
                type="text"
                className="input input-bordered"
                placeholder="Enter group name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Description (Optional)</span>
              </label>
              <textarea 
                className="textarea textarea-bordered"
                placeholder="Enter group description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          
          {/* Member Selection */}
          <div className="space-y-2">
            <label className="font-medium">Select Members</label>
            <div className="bg-base-200 rounded-lg p-2 max-h-48 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-center py-2 text-sm text-base-content/60">No users available</p>
              ) : (
                users.map(user => (
                  <div 
                    key={user._id}
                    className="flex items-center gap-3 py-2 px-3 hover:bg-base-300 rounded-lg cursor-pointer"
                    onClick={() => toggleMember(user._id)}
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
            <div className="text-sm">
              {selectedMembers.length} member{selectedMembers.length !== 1 && 's'} selected
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={isCreatingGroup || !formData.name.trim() || selectedMembers.length === 0}
            >
              {isCreatingGroup ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;