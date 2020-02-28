import React, { useState } from 'react';

import { OnePersistentTask } from '~data/index';

import TaskDisplay from './TaskDisplay';
import TaskEdit from './TaskEdit';

interface Props {
  isEditing?: boolean;
  persistentTask: OnePersistentTask;
}

const displayName = 'dashboard.LevelTasksEdit.LevelTaskListItem';

const LevelTaskListItem = ({
  isEditing: isEditingProp = false,
  persistentTask,
}: Props) => {
  const [isEditing, setIsEditing] = useState<boolean>(isEditingProp);
  return isEditing ? (
    <TaskEdit persistentTask={persistentTask} setIsEditing={setIsEditing} />
  ) : (
    <TaskDisplay persistentTask={persistentTask} setIsEditing={setIsEditing} />
  );
};

LevelTaskListItem.displayName = displayName;

export default LevelTaskListItem;
