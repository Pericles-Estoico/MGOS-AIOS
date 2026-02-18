import { describe, it, expect } from 'vitest';

/**
 * Pagination Tests - Used in Stories 2.1, 2.5, 2.6
 */

describe('Pagination Logic - AC-2.1.1, AC-2.5.1, AC-2.6.1', () => {
  const calculatePagination = (totalItems: number, itemsPerPage: number, currentPage: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const offset = currentPage * itemsPerPage;
    const limit = itemsPerPage;
    
    return {
      totalPages,
      offset,
      limit,
      hasNext: currentPage < totalPages - 1,
      hasPrev: currentPage > 0,
    };
  };

  it('should calculate correct offset and limit', () => {
    const pagination = calculatePagination(100, 20, 0);
    expect(pagination.offset).toBe(0);
    expect(pagination.limit).toBe(20);
  });

  it('should handle page 2 correctly', () => {
    const pagination = calculatePagination(100, 20, 1);
    expect(pagination.offset).toBe(20);
    expect(pagination.limit).toBe(20);
  });

  it('should calculate total pages correctly', () => {
    expect(calculatePagination(100, 20, 0).totalPages).toBe(5);
    expect(calculatePagination(101, 20, 0).totalPages).toBe(6);
    expect(calculatePagination(50, 20, 0).totalPages).toBe(3);
  });

  it('should know when there is a next page', () => {
    const page0 = calculatePagination(100, 20, 0);
    const page4 = calculatePagination(100, 20, 4);

    expect(page0.hasNext).toBe(true);
    expect(page4.hasNext).toBe(false);
  });

  it('should know when there is a previous page', () => {
    const page0 = calculatePagination(100, 20, 0);
    const page1 = calculatePagination(100, 20, 1);

    expect(page0.hasPrev).toBe(false);
    expect(page1.hasPrev).toBe(true);
  });

  it('should support variable items per page (20-100)', () => {
    const page20Items = calculatePagination(100, 20, 0);
    const page50Items = calculatePagination(100, 50, 0);
    const page100Items = calculatePagination(100, 100, 0);

    expect(page20Items.totalPages).toBe(5);
    expect(page50Items.totalPages).toBe(2);
    expect(page100Items.totalPages).toBe(1);
  });
});

describe('Sorting - AC-2.6.1', () => {
  const sortTasks = (tasks: any[], sortBy: string, ascending = true) => {
    return [...tasks].sort((a, b) => {
      if (sortBy === 'due_date') {
        const aDate = new Date(a.due_date).getTime();
        const bDate = new Date(b.due_date).getTime();
        return ascending ? aDate - bDate : bDate - aDate;
      }
      if (sortBy === 'priority') {
        const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        return ascending ? 
          priorityOrder[a.priority] - priorityOrder[b.priority] :
          priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });
  };

  it('should sort by due date (nearest first)', () => {
    const tasks = [
      { id: '1', due_date: '2026-03-01' },
      { id: '2', due_date: '2026-02-20' },
      { id: '3', due_date: '2026-02-25' },
    ];

    const sorted = sortTasks(tasks, 'due_date');
    expect(sorted[0].due_date).toBe('2026-02-20');
    expect(sorted[1].due_date).toBe('2026-02-25');
    expect(sorted[2].due_date).toBe('2026-03-01');
  });

  it('should sort by priority', () => {
    const tasks = [
      { id: '1', priority: 'low' },
      { id: '2', priority: 'critical' },
      { id: '3', priority: 'medium' },
    ];

    const sorted = sortTasks(tasks, 'priority');
    expect(sorted[0].priority).toBe('low');
    expect(sorted[1].priority).toBe('medium');
    expect(sorted[2].priority).toBe('critical');
  });
});
