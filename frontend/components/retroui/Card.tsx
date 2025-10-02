import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface ICardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  title?: string;
  children?: React.ReactNode;
}

const Card = ({ className, title, children, ...props }: ICardProps) => {
  return (
    <div
      className={cn(
        "border-2 border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] transition-all shadow-[4px_4px_0_0_var(--border)]",
        className,
      )}
      {...props}
    >
      {title && (
        <div className="border-b-2 border-[var(--border)] p-4 bg-[var(--primary)] text-[var(--primary-foreground)]">
          <h3 className="font-bold text-lg uppercase tracking-wide">{title}</h3>
        </div>
      )}
      {children && !title && children}
      {children && title && <div className="p-4">{children}</div>}
    </div>
  );
};

const CardHeader = ({ className, ...props }: ICardProps) => {
  return (
    <div
      className={cn("flex flex-col justify-start p-4 border-b-2 border-[var(--border)] bg-[var(--primary)] text-[var(--primary-foreground)]", className)}
      {...props}
    />
  );
};

const CardTitle = ({ className, ...props }: ICardProps) => {
  return <h3 className={cn("font-bold text-lg uppercase tracking-wide", className)} {...props} />;
};

const CardDescription = ({ className, ...props }: ICardProps) => (
  <p className={cn("text-sm text-[var(--primary-foreground)]/80 mt-1", className)} {...props} />
);

const CardContent = ({ className, ...props }: ICardProps) => {
  return <div className={cn("p-4", className)} {...props} />;
};

const CardFooter = ({ className, ...props }: ICardProps) => {
  return <div className={cn("p-4 border-t-2 border-[var(--border)] bg-[var(--muted)]", className)} {...props} />;
};

const CardComponent = Object.assign(Card, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});

export { CardComponent as Card };
