import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'highlight' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  trend,
  variant = 'default',
  className 
}: StatCardProps) {
  const variantStyles = {
    default: {
      card: 'bg-card hover:shadow-lg',
      icon: 'bg-primary/10 text-primary',
    },
    highlight: {
      card: 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:shadow-xl',
      icon: 'bg-white/20 text-white',
    },
    success: {
      card: 'bg-card border-success/20 hover:border-success/40',
      icon: 'bg-success/10 text-success',
    },
    warning: {
      card: 'bg-card border-warning/20 hover:border-warning/40',
      icon: 'bg-warning/10 text-warning',
    },
    danger: {
      card: 'bg-card border-destructive/20 hover:border-destructive/40',
      icon: 'bg-destructive/10 text-destructive',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 border-2',
      styles.card,
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn(
              'text-sm font-medium',
              variant === 'highlight' ? 'text-white/80' : 'text-muted-foreground'
            )}>
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend && (
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  trend.isPositive 
                    ? 'bg-success/20 text-success' 
                    : 'bg-destructive/20 text-destructive'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
          </div>
          <div className={cn(
            'p-3 rounded-xl transition-transform duration-300 group-hover:scale-110',
            styles.icon
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {/* Decorative element */}
        <div className={cn(
          'absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-5',
          variant === 'highlight' ? 'bg-white' : 'bg-primary'
        )} />
      </CardContent>
    </Card>
  );
}
