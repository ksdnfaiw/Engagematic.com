import { useState, useCallback, useRef, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { PAGE_SEO, SITE_URL, generateBreadcrumbSchema } from "@/constants/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Type,
  Copy,
  Monitor,
  Smartphone,
  Check,
  Sparkles,
  FileText,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Smile,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Eraser,
  List,
  ListOrdered,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  applyStyle,
  toBold,
  toItalic,
  toUnderline,
  toStrikethrough,
  toBulletPoints,
  toNumberedList,
  stripCombiningChars,
  type StyleId,
} from "@/utils/unicodeTextStyles";

// ---------------------------------------------------------------------------
// Style config for grid
// ---------------------------------------------------------------------------

const STYLE_ENTRIES: { id: StyleId; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "bold", label: "Bold" },
  { id: "boldSans", label: "Bold Sans" },
  { id: "italic", label: "Italic" },
  { id: "italicSans", label: "Italic Sans" },
  { id: "boldItalic", label: "Bold Italic" },
  { id: "boldItalicSans", label: "Bold Italic Sans" },
  { id: "sans", label: "Sans" },
  { id: "underline", label: "Underline" },
  { id: "strikethrough", label: "Strikethrough" },
  { id: "boldUnderline", label: "Bold Underline" },
  { id: "boldStrikethrough", label: "Bold Strikethrough" },
  { id: "script", label: "Script" },
  { id: "doublestruck", label: "Doublestruck" },
  { id: "fullwidth", label: "Fullwidth" },
  { id: "uppercase", label: "Uppercase" },
  { id: "lowercase", label: "Lowercase" },
  { id: "numberedList", label: "Numbered List" },
  { id: "bulletPoints", label: "Bullet Points" },
  { id: "checklist", label: "Checklist" },
  { id: "ascendingList", label: "Ascending List" },
  { id: "descendingList", label: "Descending List" },
];

const EMOJI_LIST = ["👍", "👏", "🔥", "💡", "✨", "🚀", "💼", "📈", "✅", "❤️", "🙌", "💬", "📌", "🎯", "🤝", "⭐", "📢", "💪", "😊", "📝"];

const MAX_HISTORY = 50;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LinkedInTextFormatterPage() {
  const [input, setInput] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const lastPushedRef = useRef<string>("");
  const { toast } = useToast();

  const pushHistory = useCallback((value: string) => {
    const arr = historyRef.current;
    const idx = historyIndexRef.current;
    const trimmed = arr.slice(0, idx + 1);
    trimmed.push(value);
    if (trimmed.length > MAX_HISTORY) trimmed.shift();
    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
    // Update undo/redo availability
    setCanUndo(trimmed.length > 1);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const arr = historyRef.current;
    let idx = historyIndexRef.current;
    if (idx <= 0) {
      toast({ title: "Nothing to undo", variant: "destructive" });
      return;
    }
    idx -= 1;
    historyIndexRef.current = idx;
    const prev = arr[idx];
    setInput(prev);
    setCanUndo(idx > 0);
    setCanRedo(true);
    toast({ title: "Undone" });
  }, [toast]);

  const redo = useCallback(() => {
    const arr = historyRef.current;
    let idx = historyIndexRef.current;
    if (idx >= arr.length - 1) {
      toast({ title: "Nothing to redo", variant: "destructive" });
      return;
    }
    idx += 1;
    historyIndexRef.current = idx;
    const next = arr[idx];
    setInput(next);
    setCanUndo(true);
    setCanRedo(idx < arr.length - 1);
    toast({ title: "Redone" });
  }, [toast]);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update undo/redo availability
  useEffect(() => {
    setCanUndo(historyRef.current.length > 0 && historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, [input]);

  const getSelection = useCallback((): { start: number; end: number; text: string } => {
    const el = textareaRef.current;
    if (!el) return { start: 0, end: input.length, text: input };
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = start !== end ? input.slice(start, end) : "";
    return { start, end, text };
  }, [input]);

  const replaceSelection = useCallback((newText: string, newCursorStart?: number, newCursorEnd?: number) => {
    const el = textareaRef.current;
    if (!el) return;
    const { start, end } = getSelection();
    const before = input.slice(0, start);
    const after = input.slice(end);
    const next = before + newText + after;
    
    // Only push to history if content actually changed
    if (next !== input) {
      pushHistory(input);
    }
    
    setInput(next);
    requestAnimationFrame(() => {
      if (el) {
        const s = newCursorStart ?? before.length + newText.length;
        const e = newCursorEnd ?? s;
        el.focus();
        el.setSelectionRange(s, e);
      }
    });
  }, [input, getSelection, pushHistory]);

  const applyToSelection = useCallback((fn: (t: string) => string) => {
    const { start, end, text } = getSelection();
    // Allow formatting even if only whitespace is selected, but require some selection
    if (start === end && input.length === 0) {
      toast({ title: "Select some text first", variant: "destructive" });
      return;
    }
    // If no text is selected but there's content, format the entire input
    if (start === end && input.length > 0) {
      const formatted = fn(input);
      pushHistory(input);
      setInput(formatted);
      toast({ title: "Formatting applied to all text" });
      return;
    }
    replaceSelection(fn(text));
  }, [input, getSelection, replaceSelection, pushHistory, toast]);

  const insertAtCursor = useCallback((insert: string) => {
    const el = textareaRef.current;
    const start = el ? el.selectionStart : input.length;
    const before = input.slice(0, start);
    const after = input.slice(el ? el.selectionEnd : input.length);
    const next = before + insert + after;
    pushHistory(input);
    setInput(next);
    requestAnimationFrame(() => {
      if (el) {
        const pos = start + insert.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  }, [input, pushHistory]);

  const handleClearFormat = useCallback(() => {
    const { start, end, text } = getSelection();
    if (start === end && input.length === 0) return;
    const toClear = start !== end ? text : input;
    const cleared = stripCombiningChars(toClear);
    if (toClear === input) {
      pushHistory(input);
      setInput(cleared);
      toast({ title: "Formatting cleared" });
    } else {
      replaceSelection(cleared);
      toast({ title: "Formatting cleared from selection" });
    }
  }, [input, getSelection, pushHistory, replaceSelection, toast]);

  const handleEmojiSelect = (emoji: string) => {
    insertAtCursor(emoji);
  };

  const handleLinkInsert = () => {
    const url = window.prompt("Enter URL:");
    if (url) insertAtCursor(url.startsWith("http") ? url : `https://${url}`);
  };

  useEffect(() => {
    if (historyRef.current.length === 0) {
      historyRef.current = [input];
      historyIndexRef.current = 0;
      lastPushedRef.current = input;
    }
  }, []);

  // Debounced history push when user types (so undo works after typing)
  useEffect(() => {
    if (input === lastPushedRef.current) return;
    const t = setTimeout(() => {
      pushHistory(input);
      lastPushedRef.current = input;
    }, 800);
    return () => clearTimeout(t);
  }, [input, pushHistory]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when textarea is focused
      const textarea = textareaRef.current;
      if (!textarea || document.activeElement !== textarea) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
      const shiftKey = e.shiftKey;

      // Ctrl+A / Cmd+A: Select All
      if (ctrlKey && e.key === 'a' && !shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        textarea.select();
        return;
      }

      // Ctrl+Z / Cmd+Z: Undo
      if (ctrlKey && e.key === 'z' && !shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const arr = historyRef.current;
        const idx = historyIndexRef.current;
        if (idx > 0) {
          undo();
        } else {
          toast({ title: "Nothing to undo", variant: "destructive" });
        }
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z / Cmd+Y or Cmd+Shift+Z: Redo
      if ((ctrlKey && e.key === 'y') || (ctrlKey && e.key === 'z' && shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
        const arr = historyRef.current;
        const idx = historyIndexRef.current;
        if (idx < arr.length - 1) {
          redo();
        } else {
          toast({ title: "Nothing to redo", variant: "destructive" });
        }
        return;
      }

      // Ctrl+B / Cmd+B: Bold
      if (ctrlKey && e.key === 'b' && !shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        applyToSelection(toBold);
        return;
      }

      // Ctrl+I / Cmd+I: Italic
      if (ctrlKey && e.key === 'i' && !shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        applyToSelection(toItalic);
        return;
      }

      // Ctrl+U / Cmd+U: Underline
      if (ctrlKey && e.key === 'u' && !shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        applyToSelection(toUnderline);
        return;
      }

      // Ctrl+Shift+X / Cmd+Shift+X: Strikethrough
      if (ctrlKey && shiftKey && e.key === 'X') {
        e.preventDefault();
        e.stopPropagation();
        applyToSelection(toStrikethrough);
        return;
      }

      // Ctrl+K / Cmd+K: Insert Link
      if (ctrlKey && e.key === 'k' && !shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleLinkInsert();
        return;
      }

      // Ctrl+Shift+L / Cmd+Shift+L: Bullet List
      if (ctrlKey && shiftKey && e.key === 'L') {
        e.preventDefault();
        e.stopPropagation();
        applyToSelection(toBulletPoints);
        return;
      }

      // Ctrl+Shift+N / Cmd+Shift+N: Numbered List
      if (ctrlKey && shiftKey && e.key === 'N') {
        e.preventDefault();
        e.stopPropagation();
        applyToSelection(toNumberedList);
        return;
      }

      // Ctrl+Shift+E / Cmd+Shift+E: Clear Formatting
      if (ctrlKey && shiftKey && e.key === 'E') {
        e.preventDefault();
        e.stopPropagation();
        handleClearFormat();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, applyToSelection, handleClearFormat, handleLinkInsert, toast]);

  const previewContent = input.trim()
    ? input
    : "Start writing and your post will appear here..\n\nYou can add images, links, #hashtags and emojis 🤩";

  const handleCopy = useCallback(
    (styleId: string, text: string) => {
      if (!text) {
        toast({ title: "Nothing to copy", variant: "destructive" });
        return;
      }
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(styleId);
        toast({ title: "Copied to clipboard" });
        setTimeout(() => setCopiedId(null), 2000);
      });
    },
    [toast]
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Free Tools", url: `${SITE_URL}/tools` },
    {
      name: "LinkedIn Text Formatter",
      url: `${SITE_URL}/tools/linkedin-text-formatter`,
    },
  ]);

  const ToolbarButton = ({
    onClick,
    disabled,
    title,
    children,
    active,
  }: {
    onClick: () => void;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
    active?: boolean;
  }) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-2 rounded-md transition-colors hover:bg-muted ${active ? "bg-muted" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      <SEO
        title={PAGE_SEO.linkedinTextFormatter.title}
        description={PAGE_SEO.linkedinTextFormatter.description}
        keywords={PAGE_SEO.linkedinTextFormatter.keywords}
        url={`${SITE_URL}/tools/linkedin-text-formatter`}
        structuredData={[breadcrumbSchema]}
      />

      {/* Hero */}
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <Badge className="mb-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                <Type className="w-3 h-3 mr-1" />
                100% Free · No login required
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                LinkedIn Text Formatter Free
              </h1>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl">
                Format LinkedIn posts with bold, italic, underline, strikethrough text using Unicode. Free LinkedIn text formatter tool works in LinkedIn posts and messages. No signup required. Best free LinkedIn text formatting tool for professional posts.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-normal">
                  For creators & marketers
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  Works in posts & messages
                </Badge>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-border/50">
              <Type className="w-16 h-16 text-primary/60" />
            </div>
          </div>
        </div>
      </section>

      {/* Main tool: toolbar + two panels */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 max-w-6xl">
        <Card className="border-2 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Left: Toolbar + Editor */}
            <div className="p-6 flex flex-col">
              <Label className="text-sm font-semibold mb-2">Your text</Label>
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-0.5 p-1.5 rounded-t-lg border border-b-0 border-border bg-muted/50">
                <div className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-1.5">
                  <ToolbarButton title="Bold (Ctrl+B)" onClick={() => applyToSelection(toBold)}>
                    <Bold className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton title="Italic (Ctrl+I)" onClick={() => applyToSelection(toItalic)}>
                    <Italic className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton title="Underline (Ctrl+U)" onClick={() => applyToSelection(toUnderline)}>
                    <UnderlineIcon className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton title="Strikethrough (Ctrl+Shift+X)" onClick={() => applyToSelection(toStrikethrough)}>
                    <Strikethrough className="h-4 w-4" />
                  </ToolbarButton>
                </div>
                <div className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-1.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        title="Insert emoji"
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <Smile className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="grid grid-cols-5 gap-1">
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="p-2 text-xl rounded hover:bg-muted transition-colors"
                            onClick={() => handleEmojiSelect(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <ToolbarButton title="Insert link (Ctrl+K)" onClick={handleLinkInsert}>
                    <LinkIcon className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton title="Insert image placeholder" onClick={() => insertAtCursor("[Image]")}>
                    <ImageIcon className="h-4 w-4" />
                  </ToolbarButton>
                </div>
                <div className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-1.5">
                  <ToolbarButton 
                    title={`Undo (Ctrl+Z${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? ' / Cmd+Z' : ''})`} 
                    onClick={undo}
                    disabled={!canUndo}
                  >
                    <Undo2 className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton 
                    title={`Redo (Ctrl+Y${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? ' / Cmd+Y' : ''} or Ctrl+Shift+Z)`} 
                    onClick={redo}
                    disabled={!canRedo}
                  >
                    <Redo2 className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton title="Clear formatting (Ctrl+Shift+E)" onClick={handleClearFormat}>
                    <Eraser className="h-4 w-4" />
                  </ToolbarButton>
                </div>
                <div className="flex items-center gap-0.5">
                  <ToolbarButton title="Bullet list (Ctrl+Shift+L)" onClick={() => applyToSelection(toBulletPoints)}>
                    <List className="h-4 w-4" />
                  </ToolbarButton>
                  <ToolbarButton title="Numbered list (Ctrl+Shift+N)" onClick={() => applyToSelection(toNumberedList)}>
                    <ListOrdered className="h-4 w-4" />
                  </ToolbarButton>
                </div>
              </div>
              <Textarea
                ref={textareaRef}
                id="formatter-input"
                placeholder="Write here..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                }}
                onBlur={() => {
                  if (input !== lastPushedRef.current) {
                    pushHistory(input);
                    lastPushedRef.current = input;
                  }
                }}
                onKeyDown={(e) => {
                  // Allow default behavior for most keys, shortcuts are handled globally
                  // But prevent default for shortcuts we handle
                  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                  const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
                  const shiftKey = e.shiftKey;

                  // Prevent browser default for shortcuts we handle
                  if (
                    (ctrlKey && (e.key === 'a' || e.key === 'z' || e.key === 'y' || e.key === 'b' || e.key === 'i' || e.key === 'u' || e.key === 'k')) ||
                    (ctrlKey && shiftKey && (e.key === 'Z' || e.key === 'X' || e.key === 'L' || e.key === 'N' || e.key === 'E'))
                  ) {
                    // Let the global handler take care of it
                    return;
                  }
                }}
                className="min-h-[220px] resize-none font-mono text-sm rounded-t-none border-t-0"
                autoFocus={false}
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Select text and use the toolbar or keyboard shortcuts.
                </p>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                  <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+A</kbd> Select All</span>
                  <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+Z</kbd> Undo</span>
                  <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+Y</kbd> Redo</span>
                  <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+B</kbd> Bold</span>
                  <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+I</kbd> Italic</span>
                  <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Ctrl+U</kbd> Underline</span>
                </div>
              </div>
            </div>

            {/* Right: LinkedIn-style preview */}
            <div className="p-6 flex flex-col bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Post Preview</span>
                <div className="flex rounded-lg border border-border bg-background p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-1.5 rounded ${previewMode === "desktop" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label="Desktop view"
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-1.5 rounded ${previewMode === "mobile" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    aria-label="Mobile view"
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div
                className={`rounded-xl border border-border bg-background p-4 transition-all ${previewMode === "mobile" ? "max-w-[340px]" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm">Your Name</div>
                    <div className="text-xs text-muted-foreground">
                      Your headline · 12h
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-foreground whitespace-pre-wrap break-words">
                  {previewContent}
                </div>
                {input.trim().length > 180 && (
                  <>
                    <span className="text-muted-foreground"> </span>
                    <span className="text-primary cursor-pointer">...more</span>
                  </>
                )}
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 text-muted-foreground text-xs">
                  <span>57</span>
                  <span>Like</span>
                  <span>Comment</span>
                  <span>Repost</span>
                  <span>Send</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Format styles grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 max-w-6xl">
        <h2 className="text-2xl font-bold mb-2">Formatted output</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Choose a style and copy the result into your LinkedIn post or message.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STYLE_ENTRIES.map(({ id, label }) => {
            const value = applyStyle(input, id);
            const isCopied = copiedId === id;
            return (
              <Card key={id} className="overflow-hidden border hover:border-primary/30 transition-colors">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="rounded-md border bg-muted/30 px-3 py-2 min-h-[44px] text-sm break-all font-mono">
                    {value || "-"}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleCopy(id, value)}
                    disabled={!value.trim()}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {isCopied ? "Copied" : "Copy text"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <h2 className="text-3xl font-bold mb-6">What is a LinkedIn Text Formatter?</h2>
            <p className="text-muted-foreground mb-4">
              A LinkedIn text formatter is a tool that helps you format text for LinkedIn posts and messages using Unicode characters. Since LinkedIn doesn't support native text formatting like bold or italic, our free LinkedIn text formatter uses Unicode symbols to create formatted text that displays correctly on LinkedIn.
            </p>
            <p className="text-muted-foreground mb-4">
              Our LinkedIn text formatter free tool allows you to create bold text, italic text, underlined text, strikethrough text, and various other text styles for your LinkedIn posts. Simply type or paste your text, select formatting options, and copy the formatted text to paste directly into LinkedIn.
            </p>

            <h3 className="text-2xl font-bold mt-8 mb-4">How to Format LinkedIn Text</h3>
            <p className="text-muted-foreground mb-4">
              Formatting LinkedIn text is easy with our LinkedIn text formatter tool:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>Type or paste your text</strong> into the LinkedIn text formatter editor</li>
              <li><strong>Select text</strong> and use the toolbar to apply formatting (bold, italic, underline, strikethrough)</li>
              <li><strong>Choose a style</strong> from our pre-formatted styles or create custom formatting</li>
              <li><strong>Copy the formatted text</strong> and paste it directly into your LinkedIn post or message</li>
            </ol>
            <p className="text-muted-foreground mb-4">
              Our LinkedIn post formatter works seamlessly with LinkedIn's platform. The Unicode characters used by our LinkedIn text formatter are recognized by LinkedIn, so your formatted text will display correctly when you post.
            </p>

            <h3 className="text-2xl font-bold mt-8 mb-4">LinkedIn Bold Text Generator</h3>
            <p className="text-muted-foreground mb-4">
              Create bold text for LinkedIn posts using our LinkedIn bold text generator. Our LinkedIn text formatter uses Unicode characters to create bold text that stands out in your LinkedIn posts. Simply select your text and apply bold formatting, then copy and paste into LinkedIn.
            </p>
            <p className="text-muted-foreground mb-4">
              Whether you need LinkedIn bold text, LinkedIn italic text, or other formatting styles, our LinkedIn text formatter free tool provides all the formatting options you need. No signup required, completely free to use.
            </p>

            <h3 className="text-2xl font-bold mt-8 mb-4">LinkedIn Italic Text and Other Styles</h3>
            <p className="text-muted-foreground mb-4">
              Our LinkedIn text formatter supports multiple text styles:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>LinkedIn Bold Text:</strong> Make important words stand out with bold formatting</li>
              <li><strong>LinkedIn Italic Text:</strong> Add emphasis with italic text formatting</li>
              <li><strong>LinkedIn Underline Text:</strong> Highlight key points with underlined text</li>
              <li><strong>LinkedIn Strikethrough Text:</strong> Show corrections or updates with strikethrough</li>
              <li><strong>LinkedIn Text Styles:</strong> Use various Unicode styles like script, sans-serif, and more</li>
            </ul>

            <h3 className="text-2xl font-bold mt-8 mb-4">Why Use Our LinkedIn Text Formatter?</h3>
            <p className="text-muted-foreground mb-4">
              Our free LinkedIn text formatter offers several advantages:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>No Signup Required:</strong> Use our LinkedIn text formatter free without creating an account</li>
              <li><strong>Multiple Formatting Options:</strong> Bold, italic, underline, strikethrough, and more</li>
              <li><strong>Real-Time Preview:</strong> See how your formatted text will look on LinkedIn</li>
              <li><strong>Easy to Use:</strong> Simple interface with keyboard shortcuts for quick formatting</li>
              <li><strong>Works in Posts & Messages:</strong> Format text for both LinkedIn posts and direct messages</li>
              <li><strong>Copy & Paste Ready:</strong> Formatted text is ready to paste directly into LinkedIn</li>
            </ul>

            <h3 className="text-2xl font-bold mt-8 mb-4">Format LinkedIn Posts Like a Pro</h3>
            <p className="text-muted-foreground mb-4">
              Professional LinkedIn posts often use formatting to make content more engaging and readable. Our LinkedIn text formatter helps you create professional-looking posts with proper formatting. Whether you're creating LinkedIn posts for personal branding, business marketing, or professional networking, our LinkedIn post formatter makes it easy to format your text.
            </p>
            <p className="text-muted-foreground mb-4">
              Use our LinkedIn text formatter to create bold headlines, italicize important points, underline key information, and format your LinkedIn content for maximum impact. Our LinkedIn text formatting tool is trusted by thousands of professionals, creators, and marketers.
            </p>

            <p className="text-muted-foreground mt-6">
              Start using our free LinkedIn text formatter today. Format your LinkedIn posts with bold, italic, underline, and strikethrough text. No signup required, completely free LinkedIn text formatting tool.
            </p>
          </div>
        </div>
      </section>

      {/* How to use */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 max-w-3xl">
        <h2 className="text-2xl font-bold mb-6">How to use the LinkedIn Text Formatter</h2>
        <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
          <li>
            <strong className="text-foreground">Type or paste</strong> - Use the editor. Select text and use the toolbar (Bold, Italic, lists, emoji, link) or pick a full-style below.
          </li>
          <li>
            <strong className="text-foreground">Copy and paste on LinkedIn</strong> - Copy the formatted text and paste it into your LinkedIn post or message.
          </li>
        </ol>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/tools">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View All Free Tools
            </Button>
          </Link>
          <Link to="/tools/linkedin-engagement-rate-calculator">
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Engagement Rate Calculator
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
