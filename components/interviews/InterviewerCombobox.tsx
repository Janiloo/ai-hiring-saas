"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { InterviewerOption } from "@/lib/queries/interviews";

interface Props {
  interviewers: InterviewerOption[];
  defaultValue?: string; // full_name string (for edit mode)
  required?:     boolean;
}

export default function InterviewerCombobox({ interviewers, defaultValue = "", required = true }: Props) {
  const inputId        = useId();
  const listId         = useId();
  const containerRef   = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  const [query,        setQuery]        = useState(defaultValue);
  const [selected,     setSelected]     = useState(defaultValue);
  const [selectedId,   setSelectedId]   = useState(
    () => interviewers.find((i) => i.full_name === defaultValue)?.user_id ?? ""
  );
  const [open,         setOpen]         = useState(false);
  const [activeIndex,  setActiveIndex]  = useState(-1);

  const filtered = query.trim() === ""
    ? interviewers
    : interviewers.filter((i) =>
        i.full_name.toLowerCase().includes(query.toLowerCase()) ||
        i.email.toLowerCase().includes(query.toLowerCase())
      );

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // If user typed but didn't select, revert to last committed selection
        setQuery(selected);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [selected]);

  function commit(interviewer: InterviewerOption) {
    setSelected(interviewer.full_name);
    setSelectedId(interviewer.user_id);
    setQuery(interviewer.full_name);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          commit(filtered[activeIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setQuery(selected);
        break;
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setSelected("");     // clear committed value until re-selected
    setSelectedId("");
    setActiveIndex(-1);  // filtered list is about to change
    setOpen(true);
  }

  function handleClear() {
    setQuery("");
    setSelected("");
    setSelectedId("");
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden fields carry the committed selection to the server action */}
      <input type="hidden" name="interviewer" value={selected} />
      <input type="hidden" name="interviewer_id" value={selectedId} />

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          required={required && !selected}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search interviewers…"
          autoComplete="off"
          className="input w-full pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear selection"
            className="absolute right-2.5 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-gray-400">
              {interviewers.length === 0
                ? "No interviewers in this organization yet."
                : "No match found."}
            </li>
          ) : (
            filtered.map((interviewer, idx) => (
              <li
                key={interviewer.user_id}
                id={`${listId}-${idx}`}
                role="option"
                aria-selected={selected === interviewer.full_name}
                onMouseDown={(e) => { e.preventDefault(); commit(interviewer); }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`flex cursor-pointer flex-col px-4 py-2.5 text-sm transition-colors ${
                  idx === activeIndex
                    ? "bg-indigo-50 text-indigo-700"
                    : selected === interviewer.full_name
                    ? "bg-gray-50 text-gray-900"
                    : "text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">{interviewer.full_name}</span>
                <span className="text-xs text-gray-400">{interviewer.email}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
