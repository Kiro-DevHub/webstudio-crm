import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 py-16">
      <p className="font-mono text-xs text-muted-foreground">404</p>
      <h1 className="text-lg font-semibold tracking-tight">Страница не найдена</h1>
      <p className="text-sm text-muted-foreground">
        Такого раздела нет. Возможно, ссылка устарела или в адресе опечатка.
      </p>
      <Button render={<Link to="/" />} className="mt-1">
        Вернуться на обзор
      </Button>
    </div>
  );
}
