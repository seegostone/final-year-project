// components/TaskResolution/TasksGrid.jsx
import React from 'react';
import TaskCard from './TaskCard';
import EmptyTasksState from './EmptyTasksState';

const TasksGrid = ({ tasks, onResolve }) => {
  if (tasks.length === 0) {
    return <EmptyTasksState />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {tasks.map((task) => (
        <TaskCard key={task._id} task={task} onResolve={onResolve} />
      ))}
    </div>
  );
};

export default TasksGrid;