"use client";

import type { ReactNode } from "react";

type Props = {
  markdown: string;
};

type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "link"; text: string; href: string };

function tokenizeInline(input: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;

  while (i < input.length) {
    const rest = input.slice(i);

    const linkMatch = rest.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      tokens.push({
        type: "link",
        text: linkMatch[1],
        href: linkMatch[2],
      });
      i += linkMatch[0].length;
      continue;
    }

    const boldMatch = rest.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      tokens.push({ type: "bold", value: boldMatch[1] });
      i += boldMatch[0].length;
      continue;
    }

    const italicMatch = rest.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      tokens.push({ type: "italic", value: italicMatch[1] });
      i += italicMatch[0].length;
      continue;
    }

    const underscoreItalic = rest.match(/^_([^_]+)_/);
    if (underscoreItalic) {
      tokens.push({ type: "italic", value: underscoreItalic[1] });
      i += underscoreItalic[0].length;
      continue;
    }

    tokens.push({ type: "text", value: rest[0] });
    i += 1;
  }

  return tokens;
}

function renderInline(text: string): ReactNode[] {
  const tokens = tokenizeInline(text);
  return tokens.map((token, idx) => {
    if (token.type === "bold") {
      return <strong key={idx}>{token.value}</strong>;
    }
    if (token.type === "italic") {
      return <em key={idx}>{token.value}</em>;
    }
    if (token.type === "link") {
      return (
        <a key={idx} href={token.href} className="text-blue-600 underline">
          {token.text}
        </a>
      );
    }
    return <span key={idx}>{token.value}</span>;
  });
}

export default function NotesRenderer({ markdown }: Props) {
  const lines = markdown.split(/\r?\n/);
  const blocks: ReactNode[] = [];

  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  function flushList() {
    if (!listBuffer) return;
    const listItems = listBuffer.items.map((item, idx) => (
      <li key={idx}>{renderInline(item)}</li>
    ));
    blocks.push(
      listBuffer.ordered ? (
        <ol key={`ol-${blocks.length}`} className="list-decimal pl-5">
          {listItems}
        </ol>
      ) : (
        <ul key={`ul-${blocks.length}`} className="list-disc pl-5">
          {listItems}
        </ul>
      )
    );
    listBuffer = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.*)/);
    const ordered = trimmed.match(/^\d+\.\s+(.*)/);

    if (unordered || ordered) {
      const orderedList = Boolean(ordered);
      const itemText = (unordered?.[1] ?? ordered?.[1] ?? "").trim();

      if (!listBuffer || listBuffer.ordered !== orderedList) {
        flushList();
        listBuffer = { ordered: orderedList, items: [] };
      }

      listBuffer.items.push(itemText);
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-6">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-2">{blocks}</div>;
}
