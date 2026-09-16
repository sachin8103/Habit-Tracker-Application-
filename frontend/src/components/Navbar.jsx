export default function Navbar({ totalHabits, totalCheckIns }) {
  return (
    <header className="navbar">
      <div>
        <p className="eyebrow">Overview</p>
        <h1>Habit Tracker</h1>
      </div>
      <div className="nav-stats" aria-label="Habit statistics">
        <div className="stat-pill">
          <span>Total habits</span>
          <strong>{totalHabits}</strong>
        </div>
        <div className="stat-pill">
          <span>Check-ins</span>
          <strong>{totalCheckIns}</strong>
        </div>
      </div>
    </header>
  );
}
