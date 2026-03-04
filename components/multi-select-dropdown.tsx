"use client";

import { useMemo, useState } from "react";

type MultiSelectDropdownProps = {
  name: string;
  label: string;
  options: string[];
  initialSelected?: string[];
  placeholder: string;
};

export function MultiSelectDropdown({
  name,
  label,
  options,
  initialSelected = [],
  placeholder,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const summaryText = useMemo(() => {
    if (!selected.length) return placeholder;
    return `${selected.length} selected`;
  }, [placeholder, selected.length]);

  function toggleOption(option: string) {
    setSelected((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
    );
  }

  return (
    <div className="block">
      <span className="text-sm font-bold">{label}</span>
      <div className="relative mt-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700"
        >
          {summaryText}
        </button>
        {open ? (
          <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <div className="max-h-48 space-y-2 overflow-auto">
              {options.map((option) => (
                <label key={option} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => toggleOption(option)}
                    className="mt-1"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {selected.map((option) => (
          <span
            key={option}
            className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800"
          >
            {option}
          </span>
        ))}
        {selected.length ? null : (
          <span className="text-xs text-slate-500">No selections yet.</span>
        )}
      </div>

      {selected.map((option) => (
        <input key={`${name}-${option}`} type="hidden" name={name} value={option} />
      ))}
    </div>
  );
}
