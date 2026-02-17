"use client";

import { useState } from "react";
import { ListingFilters } from "@/types";

interface SaveSearchDialogProps {
  filters: ListingFilters;
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SaveSearchDialog({ filters, open, onClose, onSave }: SaveSearchDialogProps) {
  const [name, setName] = useState("");

  if (!open) return null;

  const activeFilters = Object.entries(filters).filter(
    ([, v]) => v !== undefined && (!Array.isArray(v) || v.length > 0)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      setName("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Save Current Search
        </h2>

        {activeFilters.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No active filters to save.
          </p>
        ) : (
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Active filters: {activeFilters.map(([k]) => k).join(", ")}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search name..."
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500"
            autoFocus
          />

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || activeFilters.length === 0}
              className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
