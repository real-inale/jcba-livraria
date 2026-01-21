import { Link } from 'react-router-dom';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  variant?: 'default' | 'primary' | 'accent';
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  variant = 'default',
}: QuickActionCardProps) {
  const variants = {
    default: {
      card: 'bg-card hover:bg-muted/50 border-border',
      icon: 'bg-muted text-foreground',
    },
    primary: {
      card: 'bg-primary/5 hover:bg-primary/10 border-primary/20',
      icon: 'bg-primary/10 text-primary',
    },
    accent: {
      card: 'bg-accent/5 hover:bg-accent/10 border-accent/20',
      icon: 'bg-accent/10 text-accent-foreground',
    },
  };

  const styles = variants[variant];

  return (
    <Link
      to={href}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300',
        'hover:shadow-md hover:translate-y-[-2px]',
        styles.card
      )}
    >
      <div className={cn(
        'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
        styles.icon
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
