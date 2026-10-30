type VisualIconName = "device" | "order" | "empty";

export default function VisualIcon({ name, className }: { name: VisualIconName; className?: string }) {
  const paths = {
    device: <><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></>,
    order: <><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></>,
    empty: <><path d="M4 7h16v13H4zM8 7V4h8v3"/><path d="M8 12h8M8 16h5"/></>,
  }[name];
  return <span className={className} aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths}</svg></span>;
}
