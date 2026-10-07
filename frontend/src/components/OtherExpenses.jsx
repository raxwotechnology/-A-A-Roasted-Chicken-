// src/components/OtherExpenses.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API_BASE_URL from "../api.js";
import {
  getStoredCategories,
  getStoredReasons,
  saveCustomSuggestion,
  fetchExpenseSuggestions
} from "../utils/expenseSuggestions.js";

const OtherExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(getStoredCategories());
  const [reasons, setReasons] = useState(getStoredReasons());

  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Cash"
  });

  const [editingExpense, setEditingExpense] = useState(null);
  const [editData, setEditData] = useState({ ...newExpense });

  // Load all expenses and suggestions on mount
  useEffect(() => {
    fetchExpenses();
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    const token = localStorage.getItem("token");
    const data = await fetchExpenseSuggestions(API_BASE_URL, token);
    setCategories(data.categories);
    setReasons(data.reasons);
  };

  const fetchExpenses = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/expense/other`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setExpenses(res.data);

      // Merge any categories and reasons already in historical data
      if (Array.isArray(res.data)) {
        const fromHistoryCats = res.data.map(e => e.category).filter(Boolean);
        const fromHistoryReasons = res.data.map(e => e.description).filter(Boolean);

        setCategories(prev => Array.from(new Set([...prev, ...fromHistoryCats])));
        setReasons(prev => Array.from(new Set([...prev, ...fromHistoryReasons])));
      }
    } catch (err) {
      console.error("Failed to load expenses:", err.message);
      toast.error("Failed to load other expenses");
    }
  };

  // Handle form input change
  const handleChange = (e) =>
    setNewExpense({ ...newExpense, [e.target.name]: e.target.value });

  // Submit new expense
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { category, amount, date, description } = newExpense;

    if (!category || !category.trim() || !amount || !date) {
      toast.warn("Category, Amount, and Date are required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const trimmedCategory = category.trim();
      const trimmedDescription = (description || "").trim();

      const payload = {
        ...newExpense,
        category: trimmedCategory,
        description: trimmedDescription
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/auth/expense/other`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setExpenses([res.data, ...expenses]);

      // Learn / save suggestions immediately
      saveCustomSuggestion(trimmedCategory, trimmedDescription);
      if (trimmedCategory && !categories.includes(trimmedCategory)) {
        setCategories(prev => [...prev, trimmedCategory]);
      }
      if (trimmedDescription && !reasons.includes(trimmedDescription)) {
        setReasons(prev => [...prev, trimmedDescription]);
      }

      setNewExpense({
        category: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        paymentMethod: "Cash"
      });

      toast.success("Expense added successfully!");
    } catch (err) {
      console.error("Add failed:", err.response?.data || err.message);
      toast.error("Failed to add expense");
    }
  };

  // Get currency from localStorage
  const symbol = localStorage.getItem("currencySymbol") || "$";

  // Open edit modal
  const openEditModal = (expense) => {
    setEditingExpense(expense._id);
    setEditData({
      category: expense.category,
      amount: expense.amount,
      description: expense.description || "",
      date: new Date(expense.date).toISOString().split("T")[0],
      paymentMethod: expense.paymentMethod || "Cash"
    });
  };

  // Handle edit input change
  const handleEditChange = (e) =>
    setEditData({ ...editData, [e.target.name]: e.target.value });

  // Save updated expense
  const handleUpdate = async (e) => {
    e.preventDefault();

    const { category, amount, date, description } = editData;

    if (!category || !category.trim() || !amount || !date) {
      toast.warn("All required fields must be filled");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const trimmedCategory = category.trim();
      const trimmedDescription = (description || "").trim();

      const payload = {
        ...editData,
        category: trimmedCategory,
        description: trimmedDescription
      };

      const res = await axios.put(
        `${API_BASE_URL}/api/auth/expense/other/${editingExpense}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setExpenses(expenses.map((e) => (e._id === editingExpense ? res.data : e)));

      // Learn / save suggestions
      saveCustomSuggestion(trimmedCategory, trimmedDescription);
      if (trimmedCategory && !categories.includes(trimmedCategory)) {
        setCategories(prev => [...prev, trimmedCategory]);
      }
      if (trimmedDescription && !reasons.includes(trimmedDescription)) {
        setReasons(prev => [...prev, trimmedDescription]);
      }

      setEditingExpense(null);
      toast.success("Expense updated!");
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      toast.error("Failed to update expense");
    }
  };

  // Delete an expense
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/auth/expense/other/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setExpenses(expenses.filter((expense) => expense._id !== id));
      toast.success("Expense deleted");
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message);
      toast.error("Failed to delete expense");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 fw-bold text-danger border-bottom pb-2">Other Expenses</h2>

      {/* Add Expense Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border rounded shadow-sm mb-5">
        <div className="row g-3">
          {/* Dynamic Category with Datalist & Quick Suggestions */}
          <div className="col-md-6">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-semibold mb-0">Expense Category</label>
              <small className="text-muted">Type custom or select</small>
            </div>
            <input
              type="text"
              name="category"
              list="category-suggestions-list"
              value={newExpense.category}
              onChange={handleChange}
              placeholder="Type or select category..."
              className="form-control"
              required
              autoComplete="off"
            />
            <datalist id="category-suggestions-list">
              {categories.map((cat, idx) => (
                <option key={idx} value={cat} />
              ))}
            </datalist>

            {/* Quick Category Chips */}
            <div className="d-flex flex-wrap gap-1 mt-2">
              {categories.slice(0, 8).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm py-0 px-2 rounded-pill ${newExpense.category === cat ? "btn-danger" : "btn-outline-secondary"}`}
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => setNewExpense(prev => ({ ...prev, category: cat }))}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Amount ({symbol})</label>
            <input
              type="number"
              name="amount"
              value={newExpense.amount}
              onChange={handleChange}
              step="0.01"
              placeholder="e.g., 1500"
              className="form-control"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Payment Method</label>
            <select
              name="paymentMethod"
              value={newExpense.paymentMethod}
              onChange={handleChange}
              className="form-select"
            >
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Date</label>
            <input
              type="date"
              name="date"
              value={newExpense.date}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Dynamic Reason / Description with Datalist */}
          <div className="col-12 mt-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-semibold mb-0">Reason / Description</label>
              <small className="text-muted">Type any reason — auto suggests past entries</small>
            </div>
            <input
              type="text"
              name="description"
              list="reason-suggestions-list"
              value={newExpense.description}
              onChange={handleChange}
              placeholder="e.g. Gas Cylinder Refill, Vegetables, Staff Lunch, Internet bill..."
              className="form-control"
              autoComplete="off"
            />
            <datalist id="reason-suggestions-list">
              {reasons.map((r, idx) => (
                <option key={idx} value={r} />
              ))}
            </datalist>

            {/* Quick Reason Chips */}
            <div className="d-flex flex-wrap gap-1 mt-2">
              {reasons.slice(0, 6).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`btn btn-sm py-0 px-2 rounded-pill ${newExpense.description === r ? "btn-dark" : "btn-light border"}`}
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => setNewExpense(prev => ({ ...prev, description: r }))}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="col-12 mt-3">
            <button type="submit" className="btn btn-danger w-100 py-2 fs-5">
              + Add Expense
            </button>
          </div>
        </div>
      </form>

      {/* Edit Modal */}
      {editingExpense && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content rounded shadow">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Edit Expense</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingExpense(null)}
                />
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Expense Category</label>
                    <input
                      type="text"
                      name="category"
                      list="edit-category-suggestions"
                      value={editData.category}
                      onChange={handleEditChange}
                      className="form-control"
                      placeholder="Type or select category..."
                      required
                      autoComplete="off"
                    />
                    <datalist id="edit-category-suggestions">
                      {categories.map((cat, idx) => (
                        <option key={idx} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Amount ({symbol})</label>
                    <input
                      type="number"
                      name="amount"
                      value={editData.amount}
                      onChange={handleEditChange}
                      step="0.01"
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={editData.paymentMethod}
                      onChange={handleEditChange}
                      className="form-select"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={editData.date.split("T")[0]}
                      onChange={handleEditChange}
                      className="form-control"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Reason / Description</label>
                    <input
                      type="text"
                      name="description"
                      list="edit-reason-suggestions"
                      value={editData.description}
                      onChange={handleEditChange}
                      className="form-control"
                      placeholder="Reason / Description"
                      autoComplete="off"
                    />
                    <datalist id="edit-reason-suggestions">
                      {reasons.map((r, idx) => (
                        <option key={idx} value={r} />
                      ))}
                    </datalist>
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-danger w-100">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleDelete(editingExpense)}
                    >
                      Delete
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="mt-4">
        <h4 className="mb-3 text-secondary">💸 Recent Expenses</h4>
        <div className="table-responsive shadow-sm rounded border">
          <table className="table table-bordered table-striped align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Description</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense._id}>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.category}</td>
                    <td>{symbol}{expense.amount.toFixed(2)}</td>
                    <td>{expense.paymentMethod || "Cash"}</td>
                    <td>{expense.description || "-"}</td>
                    <td className="text-center">
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => openEditModal(expense)}
                          title="Edit Expense"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(expense._id)}
                          title="Delete Expense"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default OtherExpenses;