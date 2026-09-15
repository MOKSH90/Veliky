import {
  ChevronLeft,
  ChevronRight,
  FolderSearch,
  Search as SearchIcon,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
export function Button({
  children,
  variant = "secondary",
  className = "",
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      type="button"
      className={`button ${variant} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
export function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Status({ value }: { value: string }) {
  return (
    <Badge
      tone={
        /Completed|NORMAL|Ready/.test(value)
          ? "success"
          : /Awaiting|ATTENTION|Draft/.test(value)
            ? "warning"
            : /Declined|ALARM/.test(value)
              ? "danger"
              : ""
      }
    >
      <span className="status-dot" />
      {value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase())}
    </Badge>
  );
}
export function Search({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="search-field">
      <SearchIcon size={17} />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            ref.current?.focus();
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-actions">{action}</div>}
    </div>
  );
}
export function Empty({
  title = "No results found",
  description = "Try a different search or clear your filters.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <FolderSearch size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Pagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / 6));
  return (
    <div className="pagination">
      <span>
        {total
          ? `${(page - 1) * 6 + 1}–${Math.min(page * 6, total)} of ${total}`
          : "0 results"}
      </span>
      <div>
        <Button
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <span>
          Page {page} of {pages}
        </span>
        <Button
          aria-label="Next page"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const dialog = ref.current!;
    dialog.showModal();
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby="dialog-title"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const focusable = Array.from(
          ref.current!.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]',
          ),
        ).filter((el) => el.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id="dialog-title">{title}</h2>
        <button
          ref={closeRef}
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function download(
  name: string,
  content: string,
  type = "text/markdown",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
