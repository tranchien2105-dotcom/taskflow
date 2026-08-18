export interface Task {
  id: number;
  title: string;
  status: 'TODO' | 'DONE' | 'IN_PROGRESS';
  assigneeId: number;
}