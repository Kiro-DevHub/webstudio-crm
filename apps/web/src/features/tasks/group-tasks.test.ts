import { Role, TaskStatus } from '@crm/shared';
import { describe, expect, it } from 'vitest';
import { groupTasks, isTaskOverdue } from './group-tasks';
import type { TaskListItem } from './tasks.types';

const NOW = new Date('2026-07-18T12:00:00.000Z').getTime();

function task(overrides: Partial<TaskListItem>): TaskListItem {
  return {
    id: overrides.id ?? 't1',
    title: 'Задача',
    description: null,
    status: TaskStatus.TODO,
    dueDate: '2026-07-18T12:00:00.000Z',
    dealId: null,
    assigneeId: 'u1',
    assignee: { id: 'u1', name: 'Ольга', avatarColor: '#6366f1', role: Role.MANAGER },
    deal: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isTaskOverdue', () => {
  it('is true for an open task whose due date is in the past', () => {
    const t = task({ status: TaskStatus.TODO, dueDate: '2026-07-17T00:00:00.000Z' });
    expect(isTaskOverdue(t, NOW)).toBe(true);
  });

  it('is false for a DONE task even when its due date is in the past', () => {
    const t = task({ status: TaskStatus.DONE, dueDate: '2026-07-01T00:00:00.000Z' });
    expect(isTaskOverdue(t, NOW)).toBe(false);
  });

  it('is false for an open task not yet due', () => {
    const t = task({ status: TaskStatus.TODO, dueDate: '2026-07-20T00:00:00.000Z' });
    expect(isTaskOverdue(t, NOW)).toBe(false);
  });
});

describe('groupTasks', () => {
  it('never puts a DONE task into the overdue group, regardless of due date', () => {
    const tasks = [
      task({ id: 'done-past', status: TaskStatus.DONE, dueDate: '2026-07-01T00:00:00.000Z' }),
      task({ id: 'open-past', status: TaskStatus.TODO, dueDate: '2026-07-10T00:00:00.000Z' }),
    ];

    const groups = groupTasks(tasks, NOW);
    const overdue = groups.find((g) => g.key === 'overdue');

    expect(overdue?.tasks.map((t) => t.id)).toEqual(['open-past']);
  });

  it('buckets completed tasks into a separate "done" group', () => {
    const tasks = [
      task({ id: 'done-past', status: TaskStatus.DONE, dueDate: '2026-07-01T00:00:00.000Z' }),
    ];

    const groups = groupTasks(tasks, NOW);

    expect(groups.map((g) => g.key)).toEqual(['done']);
    expect(groups[0].tasks.map((t) => t.id)).toEqual(['done-past']);
  });

  it('buckets open tasks due today and later separately from overdue', () => {
    const tasks = [
      task({ id: 'overdue', status: TaskStatus.TODO, dueDate: '2026-07-17T00:00:00.000Z' }),
      task({ id: 'today', status: TaskStatus.TODO, dueDate: '2026-07-18T18:00:00.000Z' }),
      task({ id: 'upcoming', status: TaskStatus.TODO, dueDate: '2026-07-25T00:00:00.000Z' }),
    ];

    const groups = groupTasks(tasks, NOW);

    expect(groups.map((g) => g.key)).toEqual(['overdue', 'today', 'upcoming']);
    expect(groups.find((g) => g.key === 'overdue')?.tasks.map((t) => t.id)).toEqual(['overdue']);
    expect(groups.find((g) => g.key === 'today')?.tasks.map((t) => t.id)).toEqual(['today']);
    expect(groups.find((g) => g.key === 'upcoming')?.tasks.map((t) => t.id)).toEqual(['upcoming']);
  });
});
