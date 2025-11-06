// Personal Dashboard JavaScript

let tasks = [];
let currentEditingTaskId = null;
let timeChart = null;
let currentFilter = "all";
let timerInterval = null;
let activeTimerTaskId = null;

//localStorage
const STORAGE_KEYS = {
  TASKS: "dashboard_tasks",
  THEME: "dashboard_theme",
};

// Category
const CATEGORIES = {
  study: {
    name: "Study",
    icon: "📚",
    color: "#4299e1",
    keywords: [
      "study",
      "learn",
      "read",
      "course",
      "tutorial",
      "homework",
      "assignment",
    ],
  },
  work: {
    name: "Work",
    icon: "💼",
    color: "#38b2ac",
    keywords: [
      "work",
      "job",
      "meeting",
      "project",
      "office",
      "business",
      "client",
    ],
  },
  play: {
    name: "Play",
    icon: "🎮",
    color: "#ed8936",
    keywords: [
      "play",
      "game",
      "fun",
      "entertainment",
      "movie",
      "music",
      "hobby",
    ],
  },
  sleep: {
    name: "Sleep",
    icon: "😴",
    color: "#9f7aea",
    keywords: ["sleep", "rest", "nap", "bed", "relax"],
  },
  exercise: {
    name: "Exercise",
    icon: "💪",
    color: "#48bb78",
    keywords: ["exercise", "workout", "gym", "run", "walk", "sport", "fitness"],
  },
  other: {
    name: "Other",
    icon: "📝",
    color: "#a0aec0",
    keywords: [],
  },
};

// Motivation
const MOTIVATIONAL_QUOTES = [
  "Success is the sum of small efforts repeated day in and day out.",
  "The way to get started is to quit talking and begin doing.",
  "Don't watch the clock; do what it does. Keep going.",
  "The future depends on what you do today.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "It is during our darkest moments that we must focus to see the light.",
  "Believe you can and you're halfway there.",
  "The only impossible journey is the one you never begin.",
  "In the middle of difficulty lies opportunity.",
  "Success is walking from failure to failure with no loss of enthusiasm.",
];

// \ DOM
document.addEventListener("DOMContentLoaded", function () {
  console.log("Dashboard initializing...");

  loadTasksFromStorage();
  loadThemeFromStorage();

  setupEventListeners();

  startLiveUpdates();

  renderTasks();
  updateStatistics();
  updateCharts();

  restoreRunningTimers();

  setRandomQuote();

  console.log("Dashboard initialized successfully!");
});

function setupEventListeners() {
  const addTaskForm = document.getElementById("addTaskForm");
  addTaskForm.addEventListener("submit", handleAddTask);

  const editTaskForm = document.getElementById("editTaskForm");
  editTaskForm.addEventListener("submit", handleEditTask);

  const themeToggle = document.getElementById("themeToggle");
  themeToggle.addEventListener("click", toggleTheme);

  const clearAllBtn = document.getElementById("clearAllBtn");
  clearAllBtn.addEventListener("click", handleClearAllData);

  const closeModal = document.getElementById("closeModal");
  const cancelEdit = document.getElementById("cancelEdit");
  const modalOverlay = document.getElementById("editModal");

  closeModal.addEventListener("click", closeEditModal);
  cancelEdit.addEventListener("click", closeEditModal);
  modalOverlay.addEventListener("click", function (e) {
    if (e.target === modalOverlay) {
      closeEditModal();
    }
  });

  const taskNameInput = document.getElementById("taskName");
  taskNameInput.addEventListener("input", handleAutoCategorizationSuggestion);

  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", handleFilterChange);
  });

  document.addEventListener("keydown", handleKeyboardShortcuts);
}

function handleAddTask(e) {
  e.preventDefault();

  const taskName = document.getElementById("taskName").value.trim();
  const taskCategory = document.getElementById("taskCategory").value;
  const taskHours = parseInt(document.getElementById("taskHours").value) || 0;
  const taskMinutes =
    parseInt(document.getElementById("taskMinutes").value) || 0;

  if (!taskName) {
    showNotification("Please enter a task name", "error");
    return;
  }

  if (!taskCategory) {
    showNotification("Please select a category", "error");
    return;
  }

  if (taskHours === 0 && taskMinutes === 0) {
    showNotification("Please enter a duration", "error");
    return;
  }

  const newTask = {
    id: generateUniqueId(),
    name: taskName,
    category: taskCategory,
    hours: taskHours,
    minutes: taskMinutes,
    totalMinutes: taskHours * 60 + taskMinutes,
    completed: false,
    trackedMinutes: 0,
    isTimerRunning: false,
    timerStartTime: null,
    createdAt: new Date().toISOString(),
    date: new Date().toDateString(),
  };

  tasks.push(newTask);

  saveTasksToStorage();

  renderTasks();
  updateStatistics();

  setTimeout(() => {
    updateCharts();
  }, 100);

  e.target.reset();
  document.getElementById("taskHours").value = "0";
  document.getElementById("taskMinutes").value = "0";

  showNotification(`Task "${taskName}" added successfully!`, "success");

  console.log("Task added:", newTask);
}
function handleEditTask(e) {
  e.preventDefault();

  const taskName = document.getElementById("editTaskName").value.trim();
  const taskCategory = document.getElementById("editTaskCategory").value;
  const taskHours =
    parseInt(document.getElementById("editTaskHours").value) || 0;
  const taskMinutes =
    parseInt(document.getElementById("editTaskMinutes").value) || 0;

  if (!taskName || !taskCategory) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  if (taskHours === 0 && taskMinutes === 0) {
    showNotification("Please enter a duration", "error");
    return;
  }

  const taskIndex = tasks.findIndex((task) => task.id === currentEditingTaskId);
  if (taskIndex !== -1) {
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      name: taskName,
      category: taskCategory,
      hours: taskHours,
      minutes: taskMinutes,
      totalMinutes: taskHours * 60 + taskMinutes,
      updatedAt: new Date().toISOString(),
    };

    saveTasksToStorage();

    renderTasks();
    updateStatistics();

    setTimeout(() => {
      updateCharts();
    }, 100);

    closeEditModal();
    showNotification(`Task "${taskName}" updated successfully!`, "success");

    console.log("Task updated:", tasks[taskIndex]);
  }
}

function openEditModal(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  currentEditingTaskId = taskId;

  document.getElementById("editTaskName").value = task.name;
  document.getElementById("editTaskCategory").value = task.category;
  document.getElementById("editTaskHours").value = task.hours;
  document.getElementById("editTaskMinutes").value = task.minutes;

  const modal = document.getElementById("editModal");
  modal.classList.add("active");

  setTimeout(() => {
    document.getElementById("editTaskName").focus();
  }, 100);
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  modal.classList.remove("active");
  currentEditingTaskId = null;
}

function deleteTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  if (confirm(`Are you sure you want to delete "${task.name}"?`)) {
    tasks = tasks.filter((t) => t.id !== taskId);

    saveTasksToStorage();

    renderTasks();
    updateStatistics();

    setTimeout(() => {
      updateCharts();
    }, 100);

    showNotification(`Task "${task.name}" deleted successfully!`, "success");

    console.log("Task deleted:", task);
  }
}

function handleClearAllData() {
  if (
    confirm(
      "Are you sure you want to clear all data? This action cannot be undone."
    )
  ) {
    tasks = [];
    saveTasksToStorage();
    renderTasks();
    updateStatistics();
    updateCharts();
    showNotification("All data cleared successfully!", "success");
    console.log("All data cleared");
  }
}

function handleFilterChange(e) {
  const filterValue = e.target.closest(".filter-btn").dataset.filter;
  currentFilter = filterValue;

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  e.target.closest(".filter-btn").classList.add("active");

  renderTasks();
}

function toggleTaskCompletion(taskId) {
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex !== -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;

    if (tasks[taskIndex].completed && tasks[taskIndex].isTimerRunning) {
      stopTaskTimer(taskId);
    }

    saveTasksToStorage();

    renderTasks();
    updateStatistics();

    setTimeout(() => {
      updateCharts();
    }, 100);

    const status = tasks[taskIndex].completed ? "completed" : "pending";
    showNotification(`Task marked as ${status}!`, "success");

    console.log("Task completion toggled:", tasks[taskIndex]);
  }
}

function startTaskTimer(taskId) {
  if (activeTimerTaskId && activeTimerTaskId !== taskId) {
    stopTaskTimer(activeTimerTaskId);
  }

  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex !== -1) {
    if (tasks[taskIndex].trackedMinutes === undefined)
      tasks[taskIndex].trackedMinutes = 0;

    tasks[taskIndex].isTimerRunning = true;
    tasks[taskIndex].timerStartTime = Date.now();
    activeTimerTaskId = taskId;

    timerInterval = setInterval(() => {
      updateTaskTimer(taskId);
    }, 1000);

    saveTasksToStorage();

    renderTasks();

    showNotification(`Timer started for "${tasks[taskIndex].name}"`, "success");
    console.log("Timer started for task:", tasks[taskIndex]);
  }
}

function stopTaskTimer(taskId) {
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (
    taskIndex !== -1 &&
    tasks[taskIndex].isTimerRunning &&
    tasks[taskIndex].timerStartTime
  ) {
    const elapsedMs = Date.now() - tasks[taskIndex].timerStartTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    if (tasks[taskIndex].trackedMinutes === undefined)
      tasks[taskIndex].trackedMinutes = 0;
    tasks[taskIndex].trackedMinutes += elapsedMinutes;
    tasks[taskIndex].isTimerRunning = false;
    tasks[taskIndex].timerStartTime = null;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    activeTimerTaskId = null;

    if (tasks[taskIndex].trackedMinutes >= tasks[taskIndex].totalMinutes) {
      tasks[taskIndex].completed = true;
      showNotification(
        `Task "${tasks[taskIndex].name}" completed! 🎉`,
        "success"
      );
    } else {
      showNotification(`Timer stopped for "${tasks[taskIndex].name}"`, "info");
    }

    saveTasksToStorage();

    renderTasks();
    updateStatistics();

    setTimeout(() => {
      updateCharts();
    }, 100);

    console.log("Timer stopped for task:", tasks[taskIndex]);
  }
}

function updateTaskTimer(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (task && task.isTimerRunning && task.timerStartTime) {
    const elapsedMs = Date.now() - task.timerStartTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const totalTracked = (task.trackedMinutes || 0) + elapsedMinutes;

    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      const timerDisplay = taskElement.querySelector(".timer-display");
      if (timerDisplay) {
        const hours = Math.floor(totalTracked / 60);
        const minutes = totalTracked % 60;
        timerDisplay.textContent = `${hours}h ${minutes}m`;

        const progressBar = taskElement.querySelector(".timer-progress-fill");
        if (progressBar) {
          const progress = Math.min(
            (totalTracked / task.totalMinutes) * 100,
            100
          );
          progressBar.style.width = `${progress}%`;
        }
      }
    }

    if (totalTracked >= task.totalMinutes) {
      stopTaskTimer(taskId);
    }
  }
}

function handleAutoCategorizationSuggestion(e) {
  const taskName = e.target.value.toLowerCase();
  const categorySelect = document.getElementById("taskCategory");

  if (categorySelect.value) return;

  for (const [categoryKey, categoryData] of Object.entries(CATEGORIES)) {
    if (categoryData.keywords.some((keyword) => taskName.includes(keyword))) {
      categorySelect.value = categoryKey;

      categorySelect.style.borderColor = categoryData.color;
      setTimeout(() => {
        categorySelect.style.borderColor = "";
      }, 1000);

      break;
    }
  }
}

function renderTasks() {
  const tasksContainer = document.getElementById("tasksContainer");
  const emptyState = document.getElementById("emptyState");

  tasksContainer.innerHTML = "";

  let filteredTasks = [...tasks];
  if (currentFilter === "completed") {
    filteredTasks = tasks.filter((task) => task.completed);
  } else if (currentFilter === "pending") {
    filteredTasks = tasks.filter((task) => !task.completed);
  }

  if (filteredTasks.length === 0) {
    const emptyMessage =
      currentFilter === "completed"
        ? "No completed tasks yet."
        : currentFilter === "pending"
        ? "No pending tasks."
        : "No tasks added yet. Start by adding your first task!";

    emptyState.innerHTML = `
      <i class="fas fa-clipboard-list"></i>
      <p>${emptyMessage}</p>
    `;
    tasksContainer.appendChild(emptyState);
    return;
  }

  const sortedTasks = filteredTasks.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  sortedTasks.forEach((task) => {
    const taskElement = createTaskElement(task);
    tasksContainer.appendChild(taskElement);
  });
}

function createTaskElement(task) {
  const taskDiv = document.createElement("div");
  taskDiv.className = "task-item";
  taskDiv.setAttribute("data-task-id", task.id);

  const category = CATEGORIES[task.category];
  const durationText = formatDuration(task.hours, task.minutes);
  const timeAgo = getTimeAgo(new Date(task.createdAt));

  if (task.completed) {
    taskDiv.classList.add("completed");
  }

  if (task.trackedMinutes === undefined) task.trackedMinutes = 0;
  if (task.isTimerRunning === undefined) task.isTimerRunning = false;
  if (task.timerStartTime === undefined) task.timerStartTime = null;

  const currentTracked =
    task.trackedMinutes +
    (task.isTimerRunning && task.timerStartTime
      ? Math.floor((Date.now() - task.timerStartTime) / 60000)
      : 0);
  const progressPercent =
    Math.min(((currentTracked || 0) / (task.totalMinutes || 1)) * 100, 100) ||
    0;
  const trackedHours = Math.floor(currentTracked / 60) || 0;
  const trackedMins = currentTracked % 60 || 0;

  taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-name">${escapeHtml(task.name)}</div>
            <div class="task-actions">
                ${
                  !task.completed
                    ? `
                <button class="timer-btn ${
                  task.isTimerRunning ? "running" : ""
                }"
                        onclick="${
                          task.isTimerRunning
                            ? `stopTaskTimer('${task.id}')`
                            : `startTaskTimer('${task.id}')`
                        }"
                        title="${
                          task.isTimerRunning ? "Stop timer" : "Start timer"
                        }">
                    <i class="fas fa-${
                      task.isTimerRunning ? "stop" : "play"
                    }"></i>
                </button>
                `
                    : ""
                }
                <button class="complete-btn ${
                  task.completed ? "completed" : ""
                }"
                        onclick="toggleTaskCompletion('${task.id}')"
                        title="${
                          task.completed
                            ? "Mark as pending"
                            : "Mark as completed"
                        }">
                    <i class="fas fa-${
                      task.completed ? "check-circle" : "circle"
                    }"></i>
                </button>
                <button class="edit-btn" onclick="openEditModal('${
                  task.id
                }')" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteTask('${
                  task.id
                }')" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="task-details">
            <div class="task-category">
                <span>${category.icon}</span>
                <span>${category.name}</span>
            </div>
            <div class="task-duration">${durationText}</div>
        </div>
        <div class="timer-section">
            <div class="timer-info">
                <span class="timer-label">Progress:</span>
                <span class="timer-display">${trackedHours}h ${trackedMins}m / ${durationText}</span>
            </div>
            <div class="timer-progress">
                <div class="timer-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
        </div>
        <div class="task-time">${timeAgo}</div>
    `;

  return taskDiv;
}

function updateStatistics() {
  const today = new Date().toDateString();
  const todayTasks = tasks.filter((task) => task.date === today);

  const categoryHours = {
    study: 0,
    work: 0,
    play: 0,
    sleep: 0,
    exercise: 0,
    other: 0,
  };

  todayTasks.forEach((task) => {
    if (task.completed) {
      const hours = task.totalMinutes / 60;
      categoryHours[task.category] += hours;
    }
  });

  document.getElementById("studyHours").textContent = formatHours(
    categoryHours.study
  );
  document.getElementById("workHours").textContent = formatHours(
    categoryHours.work
  );
  document.getElementById("playHours").textContent = formatHours(
    categoryHours.play
  );
  document.getElementById("sleepHours").textContent = formatHours(
    categoryHours.sleep
  );
  document.getElementById("totalTasks").textContent =
    todayTasks.length.toString();

  updateProgressBars(categoryHours);
}

function updateProgressBars(categoryHours) {
  const progressBarsContainer = document.getElementById("progressBars");
  progressBarsContainer.innerHTML = "";

  const totalHours = Object.values(categoryHours).reduce(
    (sum, hours) => sum + hours,
    0
  );

  if (totalHours === 0) {
    progressBarsContainer.innerHTML =
      '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No activities recorded today</p>';
    return;
  }

  Object.entries(categoryHours).forEach(([category, hours]) => {
    if (hours > 0) {
      const percentage = (hours / totalHours) * 100;
      const categoryData = CATEGORIES[category];

      const progressItem = document.createElement("div");
      progressItem.innerHTML = `
                <div class="progress-item">
                    <span class="progress-label">${categoryData.icon} ${
        categoryData.name
      }</span>
                    <span class="progress-value">${formatHours(hours)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${category}" style="width: ${percentage}%"></div>
                </div>
            `;

      progressBarsContainer.appendChild(progressItem);
    }
  });
}

function updateCharts() {
  updateTimeChart();
}

function updateTimeChart() {
  const chartContainer = document.querySelector(".chart-container");
  const canvasId = "timeChart";

  const today = new Date().toDateString();
  const todayTasks = tasks.filter((task) => task.date === today);

  const categoryHours = {
    study: 0,
    work: 0,
    play: 0,
    sleep: 0,
    exercise: 0,
    other: 0,
  };

  todayTasks.forEach((task) => {
    if (task.completed) {
      const hours = task.totalMinutes / 60;
      categoryHours[task.category] += hours;
    }
  });

  const chartData = Object.entries(categoryHours)
    .filter(([category, hours]) => hours > 0)
    .map(([category, hours]) => ({
      category,
      hours,
      label: CATEGORIES[category].name,
      color: CATEGORIES[category].color,
    }));

  if (timeChart) {
    timeChart.destroy();
    timeChart = null;
  }

  if (chartData.length === 0) {
    chartContainer.innerHTML =
      '<p style="text-align: center; color: var(--text-light); padding: 2rem;">No data to display</p>';
    return;
  }

  chartContainer.innerHTML = `<canvas id="${canvasId}"></canvas>`;
  const ctx = document.getElementById(canvasId).getContext("2d");

  timeChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: chartData.map((item) => item.label),
      datasets: [
        {
          data: chartData.map((item) => item.hours),
          backgroundColor: chartData.map((item) => item.color),
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
            color: getComputedStyle(document.documentElement).getPropertyValue(
              "--text-primary"
            ),
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const hours = context.parsed;
              return `${context.label}: ${formatHours(hours)}`;
            },
          },
        },
      },
    },
  });
}
function startLiveUpdates() {
  updateLiveDateTime();

  setInterval(updateLiveDateTime, 1000);
}

function updateLiveDateTime() {
  const now = new Date();

  const timeString = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dateString = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  document.getElementById("liveTime").textContent = timeString;
  document.getElementById("liveDate").textContent = dateString;
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);

  const themeToggle = document.getElementById("themeToggle");
  const icon = themeToggle.querySelector("i");
  icon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";

  localStorage.setItem(STORAGE_KEYS.THEME, newTheme);

  if (timeChart) {
    setTimeout(updateCharts, 100);
  }

  console.log("Theme changed to:", newTheme);
}

function loadThemeFromStorage() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeToggle = document.getElementById("themeToggle");
  const icon = themeToggle.querySelector("i");
  icon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
}

function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    console.log("Tasks saved to localStorage:", tasks.length, "tasks");
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error);
    showNotification("Error saving data. Storage might be full.", "error");
  }
}
function loadTasksFromStorage() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (savedTasks) {
      tasks = JSON.parse(savedTasks);

      tasks.forEach((task) => {
        if (task.trackedMinutes === undefined) task.trackedMinutes = 0;
        if (task.isTimerRunning === undefined) task.isTimerRunning = false;
        if (task.timerStartTime === undefined) task.timerStartTime = null;
        if (task.completed === undefined) task.completed = false;
      });

      console.log("Tasks loaded from localStorage:", tasks.length, "tasks");
    }
  } catch (error) {
    console.error("Error loading tasks from localStorage:", error);
    tasks = [];
    showNotification("Error loading saved data. Starting fresh.", "warning");
  }
}

function restoreRunningTimers() {
  const runningTask = tasks.find((task) => task.isTimerRunning);
  if (runningTask) {
    activeTimerTaskId = runningTask.id;

    timerInterval = setInterval(() => {
      updateTaskTimer(runningTask.id);
    }, 1000);

    console.log("Restored running timer for task:", runningTask);
  }
}

function setRandomQuote() {
  const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  const quote = MOTIVATIONAL_QUOTES[randomIndex];
  document.getElementById("motivationalQuote").textContent = `"${quote}"`;
}

function handleKeyboardShortcuts(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    document.getElementById("taskName").focus();
  }

  if (e.key === "Escape") {
    closeEditModal();
  }

  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const activeElement = document.activeElement;
    const form = activeElement.closest("form");
    if (form) {
      form.dispatchEvent(new Event("submit"));
    }
  }
}


function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDuration(hours, minutes) {
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

function formatHours(hours) {
  if (hours === 0) return "0h";
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  }
  return `${hours.toFixed(1)}h`;
}

function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--surface-color);
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-hover);
        backdrop-filter: var(--backdrop-filter);
        border: 1px solid var(--border-color);
        z-index: 1001;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

  if (type === "success") {
    notification.style.borderLeftColor = "#48bb78";
    notification.style.borderLeftWidth = "4px";
  } else if (type === "error") {
    notification.style.borderLeftColor = "#e53e3e";
    notification.style.borderLeftWidth = "4px";
  } else if (type === "warning") {
    notification.style.borderLeftColor = "#ed8936";
    notification.style.borderLeftWidth = "4px";
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);

  console.log(`Notification (${type}):`, message);
}

const notificationStyles = document.createElement("style");
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

window.openEditModal = openEditModal;
window.deleteTask = deleteTask;
window.toggleTaskCompletion = toggleTaskCompletion;
window.startTaskTimer = startTaskTimer;
window.stopTaskTimer = stopTaskTimer;

console.log("Dashboard script loaded successfully!");
