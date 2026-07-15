import { Role } from '@crm/shared';
import {
  Building2,
  Handshake,
  LayoutDashboard,
  ListChecks,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Only '/' needs exact matching, otherwise it stays active on every nested route. */
  end?: boolean;
  /** Undefined means every signed-in role sees the item. */
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Клиенты', icon: Building2 },
  { to: '/deals', label: 'Сделки', icon: Handshake },
  { to: '/tasks', label: 'Задачи', icon: ListChecks },
  { to: '/settings', label: 'Настройки', icon: Settings, roles: [Role.ADMIN] },
];

export function visibleNavItems(role: Role | undefined): NavItem[] {
  if (role === undefined) return [];
  return NAV_ITEMS.filter((item) => item.roles === undefined || item.roles.includes(role));
}
