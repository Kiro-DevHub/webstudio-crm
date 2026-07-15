import { ListChecks } from 'lucide-react';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export function TasksPage() {
  return (
    <PagePlaceholder
      title="Задачи"
      description="Здесь появится список задач со сроками, исполнителями и отметкой о выполнении."
      icon={ListChecks}
    />
  );
}
