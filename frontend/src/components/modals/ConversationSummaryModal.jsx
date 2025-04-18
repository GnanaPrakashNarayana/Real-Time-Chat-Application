// frontend/src/components/modals/ConversationSummaryModal.jsx
import { useEffect, useState } from "react";
import { X, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

const ConversationSummaryModal = ({ isOpen, onClose, chatId }) => {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(
        `/messages/summary/${chatId}`
      );
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chatId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Conversation Summary</h3>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {loading ? (
            <p className="animate-pulse">Generating summary…</p>
          ) : (
            <p className="whitespace-pre-line leading-relaxed">{summary}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 p-4 border-t border-base-300">
          <button
            onClick={fetchSummary}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            <RefreshCcw className="size-4 mr-2" />
            Regenerate
          </button>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationSummaryModal;