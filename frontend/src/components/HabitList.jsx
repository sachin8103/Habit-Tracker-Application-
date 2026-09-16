import HabitCard from './HabitCard';

export default function HabitList({ habits, selectedHabitId, onSelect, onEdit, onDelete, onCheckIn, isCheckingIn }) {
  if (!habits.length) {
    return (
      <div className="empty-state">
        <h3>No habits yet</h3>
        <p>Create your first habit to start tracking streaks and check-ins.</p>
      </div>
    );
  }

  return (
    <div className="habit-list" aria-label="Habit list">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          isSelected={selectedHabitId === habit.id}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onCheckIn={onCheckIn}
          isCheckingIn={isCheckingIn === habit.id}
        />
      ))}
    </div>
  );
}
