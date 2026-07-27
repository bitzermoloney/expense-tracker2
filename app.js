const authForm = document.getElementById('authForm');
const authMessage = document.getElementById('message');
const submitButton = document.getElementById('submitButton');
const nameInput = document.getElementById('nameInput');
const nameField = nameInput.closest('.field');
const modeButtons = document.querySelectorAll('.mode-btn');
const authSection = document.getElementById('authSection');
const expensesSection = document.getElementById('expensesSection');
const logoutButton = document.getElementById('logoutButton');
const expenseForm = document.getElementById('expenseForm');
const expenseMessage = document.getElementById('expenseMessage');
const expenseTableBody = document.getElementById('expenseTableBody');
const totalSpend = document.getElementById('totalSpend');
const currentUserLabel = document.getElementById('currentUserLabel');
const expenseSubmitButton = document.getElementById('expenseSubmitButton');
const monthlyChart = document.getElementById('monthlyChart');
const monthlyBreakdown = document.getElementById('monthlyBreakdown');
const storageKey = 'expense-tracker-users';
const expensesStorageKey = 'expense-tracker-expenses';

let currentMode = 'login';
let currentUser = null;
let editingExpenseId = null;

function normalizeEmail(value) {
  return (value || '').trim().toLowerCase();
}

function normalizeUser(user) {
  return {
    ...user,
    email: normalizeEmail(user.email)
  };
}

function readUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(storageKey)) || [];
    return users.map(normalizeUser);
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(storageKey, JSON.stringify(users.map(normalizeUser)));
}

function readExpenses() {
  try {
    const expensesByUser = JSON.parse(localStorage.getItem(expensesStorageKey)) || {};
    return Object.entries(expensesByUser).reduce((accumulator, [email, expenses]) => {
      accumulator[normalizeEmail(email)] = Array.isArray(expenses) ? expenses : [];
      return accumulator;
    }, {});
  } catch (error) {
    return {};
  }
}

function saveExpenses(expensesByUser) {
  const normalizedExpenses = Object.entries(expensesByUser).reduce((accumulator, [email, expenses]) => {
    accumulator[normalizeEmail(email)] = Array.isArray(expenses) ? expenses : [];
    return accumulator;
  }, {});

  localStorage.setItem(expensesStorageKey, JSON.stringify(normalizedExpenses));
}

function getExpensesForUser(email) {
  const expensesByUser = readExpenses();
  return expensesByUser[normalizeEmail(email)] || [];
}

function saveExpensesForUser(email, expenses) {
  const expensesByUser = readExpenses();
  expensesByUser[normalizeEmail(email)] = expenses;
  saveExpenses(expensesByUser);
}

function setMode(mode) {
  currentMode = mode;
  document.querySelector('.mode-btn.active')?.classList.remove('active');
  document.querySelector(`.mode-btn[data-mode="${mode}"]`)?.classList.add('active');
  submitButton.textContent = mode === 'register' ? 'Create account' : 'Login';
  nameField.style.display = mode === 'register' ? 'flex' : 'none';
}

function resetExpenseForm() {
  expenseForm.reset();
  editingExpenseId = null;
  expenseSubmitButton.textContent = 'Add expense';
  document.getElementById('expenseDate').value = new Date().toISOString().slice(0, 10);
}

function showAuthView() {
  authSection.classList.remove('hidden');
  expensesSection.classList.add('hidden');
  authForm.reset();
  setMode('login');
  authMessage.textContent = '';
}

function startEditingExistingExpense(user) {
  const expenses = getExpensesForUser(user.email);

  if (!expenses.length) {
    expenseSubmitButton.textContent = 'Add expense';
    expenseMessage.textContent = '';
    return false;
  }

  const expenseToEdit = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  editingExpenseId = expenseToEdit.id;
  document.getElementById('expenseDescription').value = expenseToEdit.description;
  document.getElementById('expenseAmount').value = expenseToEdit.amount;
  document.getElementById('expenseDate').value = expenseToEdit.date;
  document.getElementById('expenseCategory').value = expenseToEdit.category;
  expenseSubmitButton.textContent = 'Save expense';
  expenseMessage.textContent = 'Editing expense.';
  return true;
}

function showExpensesView(user) {
  currentUser = user;
  authSection.classList.add('hidden');
  expensesSection.classList.remove('hidden');
  currentUserLabel.textContent = user.name;
  resetExpenseForm();
  renderExpenses();
  startEditingExistingExpense(user);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function getMonthKey(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
}

function buildMonthlyStats(expenses) {
  const grouped = expenses.reduce((accumulator, expense) => {
    const monthKey = getMonthKey(expense.date);

    if (!accumulator[monthKey]) {
      accumulator[monthKey] = {
        key: monthKey,
        label: getMonthLabel(expense.date),
        total: 0,
        items: []
      };
    }

    accumulator[monthKey].total += Number(expense.amount);
    accumulator[monthKey].items.push(expense);
    return accumulator;
  }, {});

  return Object.values(grouped)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6);
}

function renderDashboard() {
  if (!currentUser) {
    monthlyChart.innerHTML = '';
    monthlyBreakdown.innerHTML = '';
    return;
  }

  const expenses = getExpensesForUser(currentUser.email);

  if (!expenses.length) {
    monthlyChart.innerHTML = '<text x="20" y="90" fill="#58708b">No expenses yet</text>';
    monthlyBreakdown.innerHTML = '<p class="empty-state">Add your first expense to see monthly insights.</p>';
    return;
  }

  const monthlyData = buildMonthlyStats(expenses);
  const maxAmount = Math.max(...monthlyData.map((month) => month.total), 1);
  const chartWidth = Math.max(320, monthlyData.length * 44 + 24);
  const chartHeight = 160;
  const maxBarHeight = 96;

  monthlyChart.setAttribute('viewBox', `0 0 ${chartWidth} ${chartHeight}`);
  monthlyChart.innerHTML = `
    <rect x="0" y="0" width="${chartWidth}" height="${chartHeight}" rx="16" fill="#f7fbff"></rect>
    <line x1="26" y1="130" x2="${chartWidth - 20}" y2="130" stroke="#dbe7f2" stroke-width="1"></line>
    ${monthlyData.map((month, index) => {
      const barHeight = Math.max(16, (month.total / maxAmount) * maxBarHeight);
      const x = 30 + index * 44;
      const y = 130 - barHeight;

      return `
        <rect x="${x}" y="${y}" width="24" height="${barHeight}" rx="8" fill="#1d6df2"></rect>
        <text x="${x + 12}" y="147" text-anchor="middle" font-size="10" fill="#58708b">${month.label.split(' ')[0]}</text>
        <text x="${x + 12}" y="${y - 8}" text-anchor="middle" font-size="10" fill="#11263d">${formatCurrency(month.total)}</text>
      `;
    }).join('')}
  `;

  monthlyBreakdown.innerHTML = monthlyData.map((month) => `
    <div class="month-group">
      <div class="month-group-header">
        <strong>${month.label}</strong>
        <span>${formatCurrency(month.total)}</span>
      </div>
      <ul class="month-expense-list">
        ${month.items
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .map((expense) => `
            <li>
              <span>${expense.description}</span>
              <span>${formatCurrency(Number(expense.amount))}</span>
            </li>
          `)
          .join('')}
      </ul>
    </div>
  `).join('');
}

function renderExpenses() {
  if (!currentUser) {
    expenseTableBody.innerHTML = '';
    totalSpend.textContent = formatCurrency(0);
    renderDashboard();
    return;
  }

  const expenses = getExpensesForUser(currentUser.email);
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  totalSpend.textContent = formatCurrency(total);

  if (!expenses.length) {
    expenseTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No expenses yet. Add your first one above.</td></tr>';
    renderDashboard();
    return;
  }

  expenseTableBody.innerHTML = expenses
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((expense) => `
      <tr>
        <td>${expense.description}</td>
        <td><span class="category-badge">${expense.category}</span></td>
        <td>${formatCurrency(Number(expense.amount))}</td>
        <td>${expense.date}</td>
        <td>
          <button class="action-btn edit" data-action="edit" data-id="${expense.id}" type="button">Edit</button>
          <button class="action-btn delete" data-action="delete" data-id="${expense.id}" type="button">Delete</button>
        </td>
      </tr>
    `)
    .join('');

  renderDashboard();
}

function handleExpenseAction(event) {
  const button = event.target.closest('button[data-action]');

  if (!button || !currentUser) {
    return;
  }

  const { action, id } = button.dataset;
  const expenses = getExpensesForUser(currentUser.email);
  const expense = expenses.find((item) => item.id === id);

  if (!expense) {
    return;
  }

  if (action === 'delete') {
    const updated = expenses.filter((item) => item.id !== id);
    saveExpensesForUser(currentUser.email, updated);
    expenseMessage.textContent = 'Expense removed.';
    renderExpenses();
    return;
  }

  if (action === 'edit') {
    editingExpenseId = expense.id;
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expenseCategory').value = expense.category;
    expenseSubmitButton.textContent = 'Save expense';
    expenseMessage.textContent = 'Editing expense.';
  }
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

authForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = normalizeEmail(document.getElementById('emailInput').value);
  const password = document.getElementById('passwordInput').value;

  if (!email || !password) {
    authMessage.textContent = 'Please enter your email and password.';
    return;
  }

  const users = readUsers();

  if (currentMode === 'register') {
    const name = nameInput.value.trim();

    if (!name) {
      authMessage.textContent = 'Please enter your name.';
      return;
    }

    if (users.some((user) => user.email === email)) {
      authMessage.textContent = 'An account with that email already exists.';
      return;
    }

    users.push({ name, email, password });
    saveUsers(users);
    authMessage.textContent = `Welcome, ${name}! Your account has been created.`;
    authForm.reset();
    setMode('login');
    return;
  }

  const user = users.find((entry) => entry.email === email && entry.password === password);

  if (user) {
    authMessage.textContent = `Welcome back, ${user.name}!`;
    showExpensesView(user);
  } else {
    authMessage.textContent = 'Invalid email or password.';
  }
});

expenseForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!currentUser) {
    return;
  }

  const description = document.getElementById('expenseDescription').value.trim();
  const amount = document.getElementById('expenseAmount').value;
  const date = document.getElementById('expenseDate').value;
  const category = document.getElementById('expenseCategory').value;

  if (!description || !amount || !date) {
    expenseMessage.textContent = 'Please fill in all expense fields.';
    return;
  }

  const expenses = getExpensesForUser(currentUser.email);

  if (editingExpenseId) {
    const updatedExpenses = expenses.map((item) => item.id === editingExpenseId ? { ...item, description, amount, date, category } : item);
    saveExpensesForUser(currentUser.email, updatedExpenses);
    expenseMessage.textContent = 'Expense updated.';
  } else {
    expenses.push({
      id: `expense-${Date.now()}`,
      description,
      amount,
      date,
      category
    });
    saveExpensesForUser(currentUser.email, expenses);
    expenseMessage.textContent = 'Expense added.';
  }

  resetExpenseForm();
  renderExpenses();
});

logoutButton.addEventListener('click', () => {
  currentUser = null;
  editingExpenseId = null;
  expenseMessage.textContent = '';
  showAuthView();
});

expenseTableBody.addEventListener('click', handleExpenseAction);

setMode('login');
showAuthView();
