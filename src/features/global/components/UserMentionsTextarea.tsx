import React, { useCallback, useEffect, useRef, useState } from "react";
import { MentionsInput, Mention } from "react-mentions";

interface UserMentionsTextareaProps {
  initialValue: string;
  onPlainTextChange: (plainText: string) => void;
  placeholder?: string;
  minHeight?: number;
}

type Suggestion = { id: string; display: string };

export default function UserMentionsTextarea(props: UserMentionsTextareaProps) {
  const { initialValue, onPlainTextChange, placeholder, minHeight } = props;
  const [value, setValue] = useState<string>(initialValue);
  const debounceTimerRef = useRef<number | null>(null);
  const plainTextRef = useRef<string>(initialValue);

  useEffect(() => {
    // keep original textarea in sync on mount
    onPlainTextChange(initialValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = useCallback(
    async (query: string): Promise<Suggestion[]> => {
      if (!query || query.trim().length === 0) return [];
      try {
        const url = `https://hackforums.net/xmlhttp.php?action=get_users&query=${encodeURIComponent(
          query
        )}`;
        const response = await fetch(url, { credentials: "include" });
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return [];

        const data = await response.json();
        if (!Array.isArray(data)) return [];

        return (data as any[])
          .map((item: any) => {
            if (typeof item === "string") {
              return { id: item, display: item } as Suggestion;
            }
            if (item && typeof item === "object" && "text" in item) {
              const display = String(item.text);
              const id = "id" in item ? String(item.id) : display;
              return { id, display } as Suggestion;
            }
            return null;
          })
          .filter(Boolean) as Suggestion[];
      } catch {
        return [];
      }
    },
    []
  );

  const debouncedProvider = useCallback(
    (query: string, callback: (results: Suggestion[]) => void) => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(async () => {
        try {
          const results = await fetchUsers(query);
          callback(results);
        } catch (e) {
          callback([]);
        }
      }, 250);
    },
    [fetchUsers]
  );

  const handleChange = (
    _event: unknown,
    newValue: string,
    newPlainTextValue: string
  ) => {
    let nextMarkup = newValue;
    let nextPlain = newPlainTextValue;

    setValue(nextMarkup);
    onPlainTextChange(nextPlain);
    plainTextRef.current = nextPlain;
  };

  const baseTextStyles = {
    background: "#2a2a2a",
    color: "#cecece",
    border: "1px solid #222",
    padding: 2,
    lineHeight: 1.4,
    fontSize: 15,
    fontFamily: "Verdana, Arial, Sans-Serif",
    width: "100%",
    margin: 0,
  } as const;

  const MentionsInputStyle = {
    suggestions: {
      list: {
        backgroundColor: "#444",
        border: "1px solid rgba(0,0,0,0.15)",
        fontSize: 14,
      },
      item: {
        padding: "5px 15px",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
        "&focused": {
          backgroundColor: "#1f1f1f",
        },
        color: "#fff",
      },
    },
    height: "178px",
    input: {
      overflow: "auto",
      height: "178px",
    },
  };

  return (
    <MentionsInput
      value={value}
      onChange={handleChange}
      style={MentionsInputStyle}
      allowSuggestionsAboveCursor
      placeholder={placeholder}
    >
      <Mention
        trigger="@"
        data={debouncedProvider}
        minChar={2}
        markup="@[__display__](__id__)"
        displayTransform={(_id: string, display: string) => `@${display}@ `}
        appendSpaceOnAdd={false}
        style={{ backgroundColor: "#1d85fc73" }}
        onAdd={() => {
          //   TODO
        }}
      />
    </MentionsInput>
  );
}
