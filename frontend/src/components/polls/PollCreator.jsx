// frontend/src/components/polls/PollCreator.jsx
import { useState } from "react";
import { Plus, Minus, BarChart3, X } from "lucide-react";
import toast from "react-hot-toast";
import { useGroupStore } from "../../store/useGroupStore";

const PollCreator = ({ onClose }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isCreating, setIsCreating] = useState(false);
  
  const { createPoll, selectedGroup } = useGroupStore();
  
  const handleAddOption = () => {
    if (options.length >= 6) {
      toast.error("Maximum 6 options allowed");
      return;
    }
    setOptions([...options, ""]);
  };
  
  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  const handleCreatePoll = async () => {
    // Validate poll data
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }
    
    const validOptions = options.filter(option => option.trim() !== "");
    if (validOptions.length < 2) {
      toast.error("Please enter at least 2 options");
      return;
    }
    
    setIsCreating(true);
    
    try {
      await createPoll({
        groupId: selectedGroup._id,
        question: question.trim(),
        options: validOptions
      });
      
      toast.success("Poll created successfully");
      onClose();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="bg-base-200 rounded-lg p-4 space-y-4 animate-slideIn">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium flex items-center gap-2">
          <BarChart3 className="size-5" />
          Create Poll
        </h3>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-circle btn-sm"
        >
          <X className="size-4" />
        </button>
      </div>
      
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Question</span>
        </label>
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Enter your question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <label className="label">
          <span className="label-text font-medium">Options</span>
        </label>
        
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => handleRemoveOption(index)}
              className="btn btn-ghost btn-circle btn-sm"
              disabled={options.length <= 2}
            >
              <Minus className="size-4" />
            </button>
          </div>
        ))}
        
        <button
          type="button"
          onClick={handleAddOption}
          className="btn btn-ghost btn-sm gap-1 mt-2"
          disabled={options.length >= 6}
        >
          <Plus className="size-4" />
          Add Option
        </button>
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreatePoll}
          className="btn btn-primary"
          disabled={isCreating}
        >
          {isCreating ? "Creating..." : "Create Poll"}
        </button>
      </div>
    </div>
  );
};

export default PollCreator;