import CheckInButton from './CheckInButton';

const frequencyLabel = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HabitCard({
  habit,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onCheckIn,
  isCheckingIn,
}) {
  return (
    <article className={`habit-card ${isSelected ? 'selected' : ''}`}>
      <button type="button" className="habit-card-button" onClick={() => onSelect(habit.id)}>
        <div className="habit-card-header">
          <div>
            <p className="habit-frequency">{frequencyLabel[habit.frequency] || habit.frequency}</p>
            <h3>{habit.name}</h3>
          </div>
          <span className="habit-count">{habit.checkInCount}</span>
        </div>

        <p className="habit-description">{habit.description || 'No description provided.'}</p>

        <div className="habit-meta">
          <span>Created {formatDate(habit.createdAt)}</span>
          <span>Updated {formatDate(habit.updatedAt)}</span>
        </div>
      </button>

      <div className="habit-actions">
        <button type="button" className="secondary-button" onClick={() => onEdit(habit)}>
          Edit
        </button>
        <CheckInButton
          habitId={habit.id}
          onCheckIn={onCheckIn}
          disabled={isCheckingIn}
        />
        <button type="button" className="danger-button" onClick={() => onDelete(habit.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}
