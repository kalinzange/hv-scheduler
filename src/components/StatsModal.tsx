import React from "react";
import { BarChart3, X } from "lucide-react";
import type { Translations } from "../types";

interface StatsData {
  name: string;
  M: number;
  T: number;
  N: number;
  WE: number;
  V: number;
  Total: number;
  Hours: number;
  ExtraHours: number;
}

// Simplified HoursConfig to match actual usage
interface HoursConfigProps {
  M: number;
  T: number;
  N: number;
  target: number;
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StatsData[];
  t: Translations;
  hoursConfig: HoursConfigProps;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  data,
  t,
  hoursConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <BarChart3 size={20} /> {t.statsTitle}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-auto flex-1 mt-4 px-4 pb-4">
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead className="relative z-30">
              <tr className="text-left">
                <th className="relative p-2 border border-t border-gray-300 sticky top-0 z-30 bg-gray-100 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statName}
                </th>
                <th className="relative p-2 border border-t border-gray-300 text-center sticky top-0 z-30 bg-green-50 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statM}
                </th>
                <th className="relative p-2 border border-t border-gray-300 text-center sticky top-0 z-30 bg-orange-50 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statT}
                </th>
                <th className="relative p-2 border border-t border-gray-300 text-center sticky top-0 z-30 bg-blue-50 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statN}
                </th>
                <th className="relative p-2 border border-t border-gray-300 text-center sticky top-0 z-30 bg-purple-50 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statWE}
                </th>
                <th className="relative p-2 border border-t border-gray-300 text-center sticky top-0 z-30 bg-pink-50 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statV}
                </th>
                <th className="relative p-2 border border-t border-gray-300 text-center font-bold sticky top-0 z-30 bg-gray-100 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statTotal}
                </th>
                <th className="relative p-2 border border-t border-gray-300 text-center font-bold sticky top-0 z-30 bg-yellow-50 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statHours}
                </th>
                <th className="relative p-2 border border-t border-gray-300 text-center font-bold sticky top-0 z-30 bg-indigo-50 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statExtraHours}
                </th>
                <th className="relative p-2 border border-t border-gray-300 text-center font-bold sticky top-0 z-30 bg-gray-200 shadow-[inset_0_1px_0_0_#d1d5db]">
                  {t.statBalance}
                </th>
              </tr>
            </thead>
            <tbody className="relative z-0">
              {data.map((row) => {
                const balance = row.Hours - hoursConfig.target;
                return (
                  <tr
                    key={row.name}
                    className="bg-white hover:bg-gray-200 border-b border-gray-300"
                  >
                    <td className="p-2 border border-gray-300 font-medium">
                      {row.name}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {row.M}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {row.T}
                    </td>
                    <td className="p-2 border border-gray-300 text-center">
                      {row.N}
                    </td>
                    <td className="p-2 border border-gray-300 text-center font-bold text-purple-700">
                      {row.WE}
                    </td>
                    <td className="p-2 border border-gray-300 text-center text-pink-600">
                      {row.V}
                    </td>
                    <td className="p-2 border border-gray-300 text-center font-bold">
                      {row.Total}
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-yellow-50 font-mono">
                      {row.Hours}h
                    </td>
                    <td className="p-2 border border-gray-300 text-center bg-indigo-50 font-mono font-bold text-indigo-700">
                      {row.ExtraHours}h
                    </td>
                    <td
                      className={`p-2 border border-gray-300 text-center font-bold font-mono ${
                        balance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {balance > 0 ? "+" : ""}
                      {balance}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t bg-gray-50 flex justify-between items-center text-xs text-gray-500">
          <span>
            Target: {hoursConfig.target}h/month | Values: M=
            {hoursConfig.M}h, T={hoursConfig.T}h, N=
            {hoursConfig.N}h
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
