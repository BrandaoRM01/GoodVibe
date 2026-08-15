export function ToolBtn({
    icon,
    label,
    active,
    onClick,
}: {
    icon: React.ReactNode;
    label?: string;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors ${active ? "bg-primary/10 text-primary" : ""
                }`}
        >
            {icon}
            {label && <span>{label}</span>}
        </button>
    );
}