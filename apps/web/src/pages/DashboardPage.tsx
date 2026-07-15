import { LayoutDashboard } from 'lucide-react';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export function DashboardPage() {
  return (
    <PagePlaceholder
      title="Обзор"
      description="Здесь появятся показатели воронки, выручка по месяцам и ближайшие задачи."
      icon={LayoutDashboard}
    />
  );
}
