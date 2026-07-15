import { Building2 } from 'lucide-react';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export function ClientsPage() {
  return (
    <PagePlaceholder
      title="Клиенты"
      description="Здесь появится таблица клиентов с поиском, фильтром по источнику и карточкой компании."
      icon={Building2}
    />
  );
}
