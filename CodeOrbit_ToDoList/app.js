// To-Do List Web App: add, edit, delete, filter, complete, and persist tasks.
const STORAGE_KEY = "codeorbit-focus-list-tasks";
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const formMessage = document.getElementById("formMessage");
const editDialog = document.getElementById("editDialog");
const editForm = document.getElementById("editForm");
const editInput = document.getElementById("editInput");

let tasks = loadTasks();
let currentFilter = "all";
let editingId = null;

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(task =>
      task && typeof task.id === "string" &&
      typeof task.text === "string" && typeof task.completed === "boolean"
    ) : [];
  } catch (error) {
    console.warn("Could not read saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    formMessage.textContent = "Could not save tasks in this browser.";
    console.error("Could not save tasks:", error);
  }
}

function makeId() {
  return (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addTask(text) {
  tasks.unshift({ id: makeId(), text, completed: false, createdAt: Date.now() });
  saveTasks();
  render();
}

function updateTask(id, updates) {
  tasks = tasks.map(task => task.id === id ? { ...task, ...updates } : task);
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  render();
}

function createAction(label, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-button ${className || ""}`;
  button.textContent = label;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", handler);
  return button;
}

function render() {
  taskList.replaceChildren();
  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "active") return !task.completed;
    if (currentFilter === "completed") return task.completed;
    return true;
  });

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.text} as ${task.completed ? "active" : "completed"}`);
    checkbox.addEventListener("change", () => updateTask(task.id, { completed: checkbox.checked }));

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const actions = document.createElement("div");
    actions.className = "task-actions";
    actions.append(
      createAction("Edit", "edit", () => openEdit(task)),
      createAction("Delete", "delete", () => {
        if (window.confirm(`Delete "${task.text}"?`)) deleteTask(task.id);
      })
    );
    item.append(checkbox, text, actions);
    taskList.append(item);
  });

  emptyState.hidden = visibleTasks.length > 0;
  document.getElementById("allCount").textContent = tasks.length;
  document.getElementById("activeCount").textContent = tasks.filter(t => !t.completed).length;
  document.getElementById("completedCount").textContent = tasks.filter(t => t.completed).length;
  const remaining = tasks.filter(t => !t.completed).length;
  document.getElementById("remainingText").textContent = `${remaining} task${remaining === 1 ? "" : "s"} remaining`;

  document.querySelectorAll(".filter").forEach(button => {
    const active = button.dataset.filter === currentFilter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function openEdit(task) {
  editingId = task.id;
  editInput.value = task.text;
  if (typeof editDialog.showModal === "function") editDialog.showModal();
  else {
    const updated = window.prompt("Edit task:", task.text);
    if (updated && updated.trim()) updateTask(task.id, { text: updated.trim() });
  }
  editInput.focus();
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) {
    formMessage.textContent = "Please enter a task before adding it.";
    taskInput.focus();
    return;
  }
  formMessage.textContent = "";
  addTask(text);
  taskForm.reset();
  taskInput.focus();
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    render();
  });
});

document.getElementById("clearCompleted").addEventListener("click", () => {
  const completedCount = tasks.filter(task => task.completed).length;
  if (!completedCount) {
    formMessage.textContent = "There are no completed tasks to clear.";
    return;
  }
  if (window.confirm(`Clear ${completedCount} completed task(s)?`)) {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
  }
});

editForm.addEventListener("submit", event => {
  event.preventDefault();
  const text = editInput.value.trim();
  if (!text) {
    editInput.focus();
    return;
  }
  if (editingId) updateTask(editingId, { text });
  editingId = null;
  editDialog.close();
});

document.getElementById("cancelEdit").addEventListener("click", () => {
  editingId = null;
  editDialog.close();
});

document.getElementById("today").textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "short", month: "short", day: "numeric"
}).format(new Date());

render();
function updateCalendarDate() {
  const today = new Date();

  const monthElement = document.getElementById("dateMonth");
  const numberElement = document.getElementById("dateNumber");
  const dayElement = document.getElementById("dateDay");

  if (!monthElement || !numberElement || !dayElement) return;

  monthElement.textContent = today
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();

  numberElement.textContent = today.getDate();

  dayElement.textContent = today
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
}

updateCalendarDate();