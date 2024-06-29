window.onload = function() {
  loadTasks();
};

let taskIdCounter = 0;

function loadTasks() {
  const todoTasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
  const inProgressTasks = JSON.parse(localStorage.getItem('inProgressTasks')) || [];
  const checkTasks = JSON.parse(localStorage.getItem('checkTasks')) || [];
  const doneTasks = JSON.parse(localStorage.getItem('doneTasks')) || [];

  todoTasks.forEach(task => {
    const taskElement = createTaskElement(task.text, task.date, task.owner, 'todo');
    document.getElementById('todo-list').appendChild(taskElement);
  });

  inProgressTasks.forEach(task => {
    const taskElement = createTaskElement(task.text, task.date, task.owner, 'in-progress');
    document.getElementById('in-progress-list').appendChild(taskElement);
  });

  checkTasks.forEach(task => {
    const taskElement = createTaskElement(task.text, task.date, task.owner, 'check');
    document.getElementById('check-list').appendChild(taskElement);
  });

  doneTasks.forEach(task => {
    const taskElement = createTaskElement(task.text, task.date, task.owner, 'done');
    document.getElementById('done-list').appendChild(taskElement);
  });

  // Liste elemanlarına dragover ve drop olaylarını ekleyin
  document.querySelectorAll('.task-list').forEach(list => {
    list.addEventListener('dragover', dragOver);
    list.addEventListener('drop', drop);
  });
}

function addTask() {
  const taskInput = document.getElementById('new-task-input');
  const taskDateInput = document.getElementById('new-task-date');
  const taskOwnerInput = document.getElementById('new-task-owner');
  const taskText = taskInput.value.trim();
  const taskDate = taskDateInput.value;
  const taskOwner = taskOwnerInput.value.trim();

  if (taskText && taskDate && taskOwner) {
    const task = { text: taskText, date: taskDate, owner: taskOwner };
    const taskElement = createTaskElement(task.text, task.date, task.owner, 'todo');
    document.getElementById('todo-list').appendChild(taskElement);
    saveTasks();
    taskInput.value = '';
    taskDateInput.value = '';
    taskOwnerInput.value = '';
  } else {
    alert('Please fill in all fields: Owner, Task, and Date.');
  }
}

function createTaskElement(text, date, owner, status) {
  const task = document.createElement('div');
  task.className = 'task';
  task.draggable = true;
  task.id = `task-${taskIdCounter++}`;
  task.addEventListener('dragstart', dragStart);
  task.addEventListener('dragend', dragEnd);

  const taskDetails = document.createElement('span');
  taskDetails.innerHTML = `<strong>${owner}</strong> - ${text} (${date})`;
  taskDetails.addEventListener('click', () => moveTask(task, status, getNextStatus(status)));

  const editBtn = createButton('Edit', () => editTask(task, text, date, owner));
  const deleteBtn = createButton('Delete', () => confirmDelete(task));
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'task-buttons';

  if (status === 'todo') {
    const nextBtn = createButton('Next', () => moveTask(task, 'todo', 'in-progress'));
    buttonsContainer.appendChild(editBtn);
    buttonsContainer.appendChild(deleteBtn);
    buttonsContainer.appendChild(createEmptyButton());
    buttonsContainer.appendChild(createEmptyButton());
    buttonsContainer.appendChild(nextBtn);
  } else if (status === 'in-progress') {
    const backBtn = createButton('Back', () => moveTask(task, 'in-progress', 'todo'));
    const editBtn = createButton('Edit', () => editTask(task, text, date, owner));
    const deleteBtn = createButton('Delete', () => confirmDelete(task));    
    const nextBtn = createButton('Next', () => moveTask(task, 'in-progress', 'check'));
    buttonsContainer.appendChild(backBtn);
    buttonsContainer.appendChild(editBtn);
    buttonsContainer.appendChild(deleteBtn);
    buttonsContainer.appendChild(nextBtn);
  } else if (status === 'check') {
    const backBtn = createButton('Back', () => moveTask(task, 'check', 'in-progress'));
    const editBtn = createButton('Edit', () => editTask(task, text, date, owner));
    const deleteBtn = createButton('Delete', () => confirmDelete(task)); 
    const nextBtn = createButton('Next', () => moveTask(task, 'check', 'done'));
    buttonsContainer.appendChild(backBtn);
    buttonsContainer.appendChild(editBtn);
    buttonsContainer.appendChild(deleteBtn);
    buttonsContainer.appendChild(nextBtn);
  } else if (status === 'done') {
    const backBtn = createButton('Back', () => moveTask(task, 'done', 'check'));
    const editBtn = createButton('Edit', () => editTask(task, text, date, owner));
    const finishBtn = createButton('Finish', () => confirmFinish(task));
    buttonsContainer.appendChild(createEmptyButton()); 
    buttonsContainer.appendChild(backBtn);
    buttonsContainer.appendChild(createEmptyButton());
    buttonsContainer.appendChild(editBtn);
    buttonsContainer.appendChild(createEmptyButton());
    buttonsContainer.appendChild(finishBtn);
  }

  task.appendChild(taskDetails);
  task.appendChild(buttonsContainer);
  return task;
}

function createButton(text, onClickHandler) {
  const button = document.createElement('button');
  button.textContent = text;
  button.addEventListener('click', onClickHandler);
  return button;
}

function createEmptyButton() {
  const button = document.createElement('button');
  button.style.visibility = 'hidden'; // Make the button invisible
  return button;
}

function editTask(task, oldText, oldDate, oldOwner) {
  const newText = prompt('Edit task:', oldText);
  const newDate = prompt('Edit due date (YYYY-MM-DD):', oldDate);
  const newOwner = prompt('Edit task owner:', oldOwner);

  if (newText && newDate && newOwner) {
    task.firstChild.innerHTML = `<strong>${newOwner}</strong> - ${newText} (${newDate})`;
    saveTasks();
  }
}

function confirmDelete(task) {
  const confirmDelete = confirm('Are you sure you want to delete this task?');
  if (confirmDelete) {
    deleteTask(task);
  }
}

function deleteTask(task) {
  const parentList = task.parentElement;
  task.remove();
  saveTasks();
}

function moveTask(task, currentStatus, targetStatus) {
  const taskText = task.firstChild.innerHTML;
  const [owner, text, date] = parseTaskText(taskText);

  const sourceListId = getListId(currentStatus);
  const targetListId = getListId(targetStatus);

  const sourceList = document.getElementById(sourceListId);
  const targetList = document.getElementById(targetListId);

  if (sourceList && targetList) {
    // Remove task from source list
    sourceList.removeChild(task);

    // Update task status in task element and move to target list
    const taskElement = createTaskElement(text, date, owner, targetStatus);
    targetList.appendChild(taskElement);

    saveTasks();
  }
}

function getPreviousStatus(currentStatus) {
  if (currentStatus === 'in-progress') {
    return 'todo';
  } else if (currentStatus === 'check') {
    return 'in-progress';
  } else if (currentStatus === 'done') {
    return 'check';
  } else {
    return ''; // Handle other cases if necessary
  }
}

function getNextStatus(status) {
  if (status === 'todo') {
    return 'in-progress';
  } else if (status === 'in-progress') {
    return 'check';
  } else if (status === 'check') {
    return 'done';
  } else {
    return '';
  }
}

function getListId(status) {
  if (status === 'todo') {
    return 'todo-list';
  } else if (status === 'in-progress') {
    return 'in-progress-list';
  } else if (status === 'check') {
    return 'check-list';
  } else if (status === 'done') {
    return 'done-list';
  }
}

function confirmFinish(task) {
  const confirmFinish = confirm('Are you sure you want to finish this task?');
  if (confirmFinish) {
    deleteTask(task);
  }
}

function saveTasks() {
  const todoTasks = Array.from(document.getElementById('todo-list').children).map(task => {
    const [owner, text, date] = parseTaskText(task.firstChild.innerHTML);
    return { text, date, owner };
  });

  const inProgressTasks = Array.from(document.getElementById('in-progress-list').children).map(task => {
    const [owner, text, date] = parseTaskText(task.firstChild.innerHTML);
    return { text, date, owner };
  });

  const checkTasks = Array.from(document.getElementById('check-list').children).map(task => {
    const [owner, text, date] = parseTaskText(task.firstChild.innerHTML);
    return { text, date, owner };
  });

  const doneTasks = Array.from(document.getElementById('done-list').children).map(task => {
    const [owner, text, date] = parseTaskText(task.firstChild.innerHTML);
    return { text, date, owner };
  });

  localStorage.setItem('todoTasks', JSON.stringify(todoTasks));
  localStorage.setItem('inProgressTasks', JSON.stringify(inProgressTasks));
  localStorage.setItem('checkTasks', JSON.stringify(checkTasks));
  localStorage.setItem('doneTasks', JSON.stringify(doneTasks));
}

function parseTaskText(taskText) {
  const owner = taskText.match(/<strong>(.*?)<\/strong>/)[1];
  const text = taskText.split(' - ')[1].split(' (')[0];
  const date = taskText.split(' (')[1].split(')')[0];
  return [owner, text, date];
}

function dragStart(event) {
  event.dataTransfer.setData('text/plain', event.target.id);
  setTimeout(() => {
    event.target.classList.add('hide');
  }, 0);
}

function dragEnd(event) {
  event.target.classList.remove('hide');
}

function dragOver(event) {
  event.preventDefault();
}

function drop(event) {
  event.preventDefault();
  const id = event.dataTransfer.getData('text/plain');
  const draggable = document.getElementById(id);
  const dropZone = event.target.closest('.task-list');

  if (dropZone) {
    const newStatus = dropZone.id.replace('-list', '');
    const [owner, text, date] = parseTaskText(draggable.firstChild.innerHTML);
    const newTaskElement = createTaskElement(text, date, owner, newStatus);
    dropZone.appendChild(newTaskElement);
    draggable.remove();
    saveTasks();
  }
}


  