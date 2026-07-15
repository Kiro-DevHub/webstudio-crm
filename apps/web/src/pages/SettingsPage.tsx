import { Settings } from 'lucide-react';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export function SettingsPage() {
  return (
    <PagePlaceholder
      title="Настройки"
      description="Здесь появится управление пользователями: приглашение, роли и отключение доступа."
      icon={Settings}
    />
  );
}
