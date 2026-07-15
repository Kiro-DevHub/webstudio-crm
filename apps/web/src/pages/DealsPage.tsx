import { Handshake } from 'lucide-react';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export function DealsPage() {
  return (
    <PagePlaceholder
      title="Сделки"
      description="Здесь появится канбан по стадиям воронки с перетаскиванием карточек."
      icon={Handshake}
    />
  );
}
