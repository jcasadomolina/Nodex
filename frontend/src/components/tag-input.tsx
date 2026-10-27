"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useTags } from "@/lib/queries/tags";

const MAX_TAGS = 10;

export function normalizeTag(name: string) {
  return name.trim().toLowerCase().replace(/^#+/, "").replace(/\s+/g, "-").slice(0, 30);
}

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
};

export function TagInput({ value, onChange }: TagInputProps) {
  const suggestions = useTags();
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const tag = normalizeTag(raw);
    if (tag && !value.includes(tag) && value.length < MAX_TAGS) onChange([...value, tag]);
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5 focus-within:border-ring">
      {value.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-sm">
          #{tag}
          <button type="button" aria-label={`Quitar #${tag}`} onClick={() => onChange(value.filter((t) => t !== tag))}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id="nodex-tags"
        list="tag-suggestions"
        value={draft}
        onChange={(event) => {
          const text = event.target.value;
          if (text.endsWith(",")) add(text.slice(0, -1));
          else setDraft(text);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && draft.trim()) {
            event.preventDefault();
            add(draft);
          }
          if (event.key === "Backspace" && !draft && value.length > 0) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft.trim() && add(draft)}
        disabled={value.length >= MAX_TAGS}
        placeholder={value.length >= MAX_TAGS ? "Máximo 10 etiquetas" : "cocina, viajes…"}
        className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none"
      />
      <datalist id="tag-suggestions">
        {suggestions.data?.filter((t) => !value.includes(t.name)).map((t) => <option key={t.name} value={t.name} />)}
      </datalist>
    </div>
  );
}
