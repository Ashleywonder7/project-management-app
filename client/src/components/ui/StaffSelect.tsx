import React, { useState } from 'react';

export interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
}

interface StaffSelectProps {
  staffList: StaffOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
  placeholder?: string;
}

export const StaffSelect: React.FC<StaffSelectProps> = ({
  staffList,
  selectedId,
  onSelect,
  label,
  placeholder = 'Select Staff Member...',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedStaff = staffList.find((s) => s.id === selectedId);

  const filteredStaff = staffList.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <label className="block text-xs font-semibold text-slate-300 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-left text-sm text-slate-100 flex justify-between items-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <span>
          {selectedStaff
            ? `${selectedStaff.firstName} ${selectedStaff.lastName}`
            : placeholder}
        </span>
        <span className="text-slate-400 text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-md shadow-lg max-h-60 overflow-y-auto p-2">
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-100 mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {filteredStaff.length === 0 ? (
            <div className="text-xs text-slate-500 p-2">No staff members found</div>
          ) : (
            filteredStaff.map((staff) => (
              <div
                key={staff.id}
                onClick={() => {
                  onSelect(staff.id);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`p-2 text-sm rounded cursor-pointer transition hover:bg-slate-800 ${
                  selectedId === staff.id ? 'bg-indigo-600/20 text-indigo-400 font-medium' : 'text-slate-200'
                }`}
              >
                <div>{staff.firstName} {staff.lastName}</div>
                {staff.jobTitle && <div className="text-xs text-slate-500">{staff.jobTitle}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};