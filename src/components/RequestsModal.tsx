import React from "react";
import { Inbox, CheckCircle, Clock, Check, X } from "lucide-react";
import type { ShiftRequest, Translations } from "../types";

interface RequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ShiftRequest[];
  onApprove: (request: ShiftRequest) => void;
  onReject: (request: ShiftRequest) => void;
  t: Translations;
}

export const RequestsModal: React.FC<RequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  onApprove,
  onReject,
  t,
}) => {
  if (!isOpen) return null;

  const pending = requests
    .filter((r) => r.status === "PENDING")
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Inbox size={20} className="text-indigo-600" /> {t.pendingRequests}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {pending.length === 0 ? (
            <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-2">
              <CheckCircle size={48} className="text-gray-200" />
              {t.noRequests}
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((req) => (
                <div
                  key={req.id}
                  className="border rounded-lg p-3 bg-white shadow-sm flex items-start gap-3"
                >
                  <div className="bg-yellow-100 text-yellow-700 p-2 rounded-full">
                    <Clock size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-800">
                        {req.empName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(req.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {t.reqDesc}{" "}
                      <span className="font-mono bg-gray-100 px-1 rounded">
                        {req.date}
                      </span>{" "}
                      {t.to} <strong>{req.newShift || "Auto"}</strong>
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onApprove(req)}
                      className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      title={t.approve}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => onReject(req)}
                      className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title={t.reject}
                    >
                      <X size={18} />
                    </button>
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
