import { avatarInkFor, initialsOf } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  color: string;
  className?: string;
}

export function UserAvatar({ name, color, className }: UserAvatarProps) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundColor: color, color: avatarInkFor(color) }}
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
