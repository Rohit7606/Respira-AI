import { cn } from "@/lib/utils";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid md:auto-rows-[minmax(180px,auto)] grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-[1600px] mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
    children,
    onClick,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    onClick?: () => void;
}) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "row-span-1 rounded-3xl group/bento transition duration-300 ease-in-out",
                "bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm",
                "hover:bg-white/60 dark:hover:bg-slate-900/60 hover:shadow-xl hover:-translate-y-1 hover:border-teal-500/30",
                "flex flex-col justify-between p-6 space-y-4",
                onClick && "cursor-pointer",
                className
            )}
        >
            {header && (
                <div className="w-full flex-1 min-h-[6rem] rounded-xl overflow-hidden relative">
                    {header}
                </div>
            )}
            {children}

            {(title || description || icon) && (
                <div className="group-hover/bento:translate-x-1 transition duration-200">
                    {icon && <div className="mb-3">{icon}</div>}
                    {title && (
                        <div className="font-sans font-bold text-neutral-800 dark:text-neutral-100 mb-1">
                            {title}
                        </div>
                    )}
                    {description && (
                        <div className="font-sans font-medium text-neutral-500 dark:text-neutral-400 text-xs">
                            {description}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
