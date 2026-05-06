import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import { emitExplainRequest } from "@/lib/explainSelectionEvents";

interface PopoverState {
  text: string;
  surrounding: string;
  top: number;
  left: number;
}

const MIN_LEN = 3;
const MAX_SELECTION = 400;
const MAX_SURROUNDING = 600;

function getSurroundingText(node: Node | null): string {
  let el: HTMLElement | null =
    node instanceof HTMLElement
      ? node
      : node?.parentElement ?? null;
  while (el) {
    const display = window.getComputedStyle(el).display;
    if (display === "block" || display === "list-item" || el.tagName === "LI" || el.tagName === "P") {
      const txt = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (txt.length > 0) return txt.slice(0, MAX_SURROUNDING);
    }
    el = el.parentElement;
  }
  return "";
}

/**
 * Mounts globally; watches for text selections inside any element marked
 * with `data-explainable="true"` and shows a floating "Explain" pill.
 */
export function ExplainSelectionPopover() {
  const [state, setState] = useState<PopoverState | null>(null);

  const hide = useCallback(() => setState(null), []);

  useEffect(() => {
    const handle = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setState(null);
        return;
      }
      const text = sel.toString().trim();
      if (text.length < MIN_LEN) {
        setState(null);
        return;
      }

      const range = sel.getRangeAt(0);
      const anchor = range.commonAncestorContainer;
      const anchorEl =
        anchor instanceof HTMLElement ? anchor : anchor.parentElement;
      const explainable = anchorEl?.closest('[data-explainable="true"]');
      if (!explainable) {
        setState(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setState(null);
        return;
      }

      setState({
        text: text.slice(0, MAX_SELECTION),
        surrounding: getSurroundingText(anchor),
        top: rect.top + window.scrollY - 44,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    };

    // mouseup catches the end of a drag-select; selectionchange catches
    // keyboard / programmatic changes. Debounce slightly so we read the
    // final selection.
    const onMouseUp = () => setTimeout(handle, 0);
    const onTouchEnd = () => setTimeout(handle, 0);
    const onSelectionChange = () => {
      // Only react when there's actually a selection — avoids hiding while
      // the user is mid-drag.
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setState(null);
    };

    const onScroll = () => setState(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setState(null);
    };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-explain-popover]")) return;
      // Defer: if this mousedown starts a new selection, the mouseup
      // handler above will reposition us.
      setState(null);
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!state) return null;

  const handleExplain = () => {
    emitExplainRequest({ selection: state.text, surrounding: state.surrounding });
    window.getSelection()?.removeAllRanges();
    hide();
  };

  return createPortal(
    <button
      data-explain-popover
      onMouseDown={(e) => e.preventDefault()} // don't clobber selection before click
      onClick={handleExplain}
      style={{
        position: "absolute",
        top: state.top,
        left: state.left,
        transform: "translateX(-50%)",
        zIndex: 60,
      }}
      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg ring-1 ring-primary/30 hover:bg-primary/90 transition-colors animate-in fade-in zoom-in-95"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Explain
    </button>,
    document.body,
  );
}
