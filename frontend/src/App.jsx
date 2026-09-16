import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import HabitList from './components/HabitList';
import HabitForm from './components/HabitForm';
import ErrorMessage from './components/ErrorMessage';
import LoadingState from './components/LoadingState';
import {
  createCheckIn,
  createHabit,
  deleteHabit,
  getHabitById,
  getHabitCheckIns,
  getHabits,
  updateHabit,
} from './api/habits';

const emptyForm = {
  name: '',
  description: '',
  frequency: 'DAILY',
};

function App() {
  const [habits, setHabits] = useState([]);
  const [selectedHabitId, setSelectedHabitId] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formMode, setFormMode] = useState('create');
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkingInId, setCheckingInId] = useState(null);
  const [apiError, setApiError] = useState('');
  const [habitDetails, setHabitDetails] = useState(null);
  const [habitHistory, setHabitHistory] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const selectedHabit = useMemo(
    () => habits.find((habit) => habit.id === selectedHabitId) || null,
    [habits, selectedHabitId],
  );

  const totalCheckIns = useMemo(
    () => habits.reduce((sum, habit) => sum + Number(habit.checkInCount || 0), 0),
    [habits],
  );

  const loadHabits = async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await getHabits();
      setHabits(data);
      if (!data.length) {
        setSelectedHabitId(null);
        setHabitDetails(null);
        setHabitHistory([]);
        return;
      }

      const nextSelection = selectedHabitId && data.some((habit) => habit.id === selectedHabitId)
        ? selectedHabitId
        : data[0].id;
      setSelectedHabitId(nextSelection);
    } catch (error) {
      setApiError(error.message || 'Unable to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    if (!selectedHabitId) {
      setHabitDetails(null);
      setHabitHistory([]);
      return;
    }

    const fetchDetails = async () => {
      setDetailsLoading(true);
      setDetailsError('');
      try {
        const [habit, checkIns] = await Promise.all([
          getHabitById(selectedHabitId),
          getHabitCheckIns(selectedHabitId),
        ]);
        setHabitDetails(habit);
        setHabitHistory(checkIns);
      } catch (error) {
        setDetailsError(error.message || 'Unable to load habit details');
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedHabitId]);

  const validateForm = (values) => {
    const errors = {};

    if (!values.name.trim()) {
      errors.name = 'Name is required.';
    } else if (values.name.trim().length > 100) {
      errors.name = 'Name must be 100 characters or fewer.';
    }

    if (values.description && values.description.length > 500) {
      errors.description = 'Description must be 500 characters or fewer.';
    }

    if (!values.frequency) {
      errors.frequency = 'Frequency is required.';
    }

    return errors;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: '' }));
  };

  const resetForm = () => {
    setFormValues(emptyForm);
    setFormErrors({});
    setFormMode('create');
    setEditingHabitId(null);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const errors = validateForm(formValues);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setApiError('');
    try {
      const created = await createHabit({
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        frequency: formValues.frequency,
      });
      setHabits((current) => [created, ...current]);
      setSelectedHabitId(created.id);
      resetForm();
    } catch (error) {
      setApiError(error.message || 'Unable to create habit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (habit) => {
    setFormMode('edit');
    setEditingHabitId(habit.id);
    setFormValues({
      name: habit.name,
      description: habit.description || '',
      frequency: habit.frequency,
    });
    setFormErrors({});
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const errors = validateForm(formValues);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setApiError('');
    try {
      const updated = await updateHabit(editingHabitId, {
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        frequency: formValues.frequency,
      });
      setHabits((current) => current.map((habit) => (habit.id === updated.id ? updated : habit)));
      setSelectedHabitId(updated.id);
      resetForm();
    } catch (error) {
      setApiError(error.message || 'Unable to update habit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (habitId) => {
    const habit = habits.find((item) => item.id === habitId);
    const confirmed = window.confirm(`Delete "${habit?.name || 'this habit'}"?`);
    if (!confirmed) return;

    setApiError('');
    try {
      await deleteHabit(habitId);
      const nextHabits = habits.filter((item) => item.id !== habitId);
      setHabits(nextHabits);
      if (selectedHabitId === habitId) {
        setSelectedHabitId(nextHabits[0]?.id ?? null);
      }
      if (editingHabitId === habitId) {
        resetForm();
      }
    } catch (error) {
      setApiError(error.message || 'Unable to delete habit');
    }
  };

  const handleCheckIn = async (habitId) => {
    const today = new Date().toISOString().slice(0, 10);
    setCheckingInId(habitId);
    setApiError('');
    try {
      const response = await createCheckIn(habitId, today);
      const updatedHabit = await getHabitById(habitId);
      setHabits((current) => current.map((habit) => (habit.id === habitId ? updatedHabit : habit)));
      setHabitHistory((current) => [response, ...current]);
      setHabitDetails(updatedHabit);
    } catch (error) {
      setApiError(error.message || 'Unable to check in today');
    } finally {
      setCheckingInId(null);
    }
  };

  const handleSubmit = formMode === 'create' ? handleCreate : handleUpdate;

  if (loading) {
    return (
      <div className="app-shell">
        <LoadingState message="Loading habits..." />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar totalHabits={habits.length} totalCheckIns={totalCheckIns} />
      <ErrorMessage message={apiError} />

      <main className="dashboard-grid">
        <section className="panel left-panel">
          <div className="section-header">
            <h2>Habits</h2>
          </div>
          <HabitList
            habits={habits}
            selectedHabitId={selectedHabitId}
            onSelect={setSelectedHabitId}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onCheckIn={handleCheckIn}
            isCheckingIn={checkingInId}
          />
        </section>

        <aside className="panel right-panel">
          <HabitForm
            values={formValues}
            errors={formErrors}
            isSubmitting={submitting}
            mode={formMode}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={resetForm}
          />
        </aside>
      </main>

      <section className="panel detail-panel">
        <div className="section-header">
          <h2>Habit details</h2>
          {selectedHabit && (
            <button type="button" className="secondary-button" onClick={() => handleEditClick(selectedHabit)}>
              Edit
            </button>
          )}
        </div>

        {!selectedHabit && !detailsLoading ? (
          <div className="empty-state small">
            <h3>No habit selected</h3>
            <p>Select a habit from the list to view details and history.</p>
          </div>
        ) : null}

        {detailsLoading ? (
          <LoadingState message="Loading details..." />
        ) : null}

        {detailsError ? (
          <ErrorMessage message={detailsError} />
        ) : null}

        {habitDetails && (
          <>
            <div className="detail-summary">
              <div>
                <p className="eyebrow">{habitDetails.frequency}</p>
                <h3>{habitDetails.name}</h3>
              </div>
              <button type="button" className="primary-button" onClick={() => handleCheckIn(habitDetails.id)}>
                {checkingInId === habitDetails.id ? 'Checking in...' : 'Check in today'}
              </button>
            </div>
            <p className="detail-description">{habitDetails.description || 'No description provided.'}</p>
          </>
        )}

        {habitDetails && (
          <div className="history-section">
            <h4>Check-in history</h4>
            {!habitHistory.length ? (
              <div className="empty-state small">
                <p>No check-ins recorded yet.</p>
              </div>
            ) : (
              <ul className="history-list">
                {habitHistory.map((entry) => (
                  <li key={entry.id}>
                    <span>{entry.checkInDate}</span>
                    <small>{new Date(entry.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
