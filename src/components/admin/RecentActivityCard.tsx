import { Link } from 'react-router-dom';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: {
    label: string;
    variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  };
  meta?: string;
  avatar?: string;
}

interface RecentActivityCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  items: ActivityItem[];
  viewAllLink: string;
  viewAllLabel?: string;
  emptyState?: {
    icon: LucideIcon;
    message: string;
  };
  renderItem?: (item: ActivityItem) => React.ReactNode;
}

export function RecentActivityCard({
  title,
  description,
  icon: Icon,
  items,
  viewAllLink,
  viewAllLabel = 'Ver Todos',
  emptyState,
  renderItem,
}: RecentActivityCardProps) {
  const badgeVariants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
    info: 'bg-primary/10 text-primary',
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link to={viewAllLink}>
            {viewAllLabel}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {emptyState && (
              <>
                <div className="p-4 rounded-full bg-success/10 mb-3">
                  <emptyState.icon className="h-8 w-8 text-success" />
                </div>
                <p className="text-muted-foreground">{emptyState.message}</p>
              </>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-3">
              {items.map((item) => (
                renderItem ? renderItem(item) : (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {item.avatar && (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {item.avatar}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {item.badge && (
                        <span className={cn(
                          'inline-block text-xs font-medium px-2.5 py-1 rounded-full',
                          badgeVariants[item.badge.variant]
                        )}>
                          {item.badge.label}
                        </span>
                      )}
                      {item.meta && (
                        <p className="text-xs text-muted-foreground mt-1">{item.meta}</p>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
