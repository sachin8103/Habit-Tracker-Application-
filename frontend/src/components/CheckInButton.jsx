export default function CheckInButton({ habitId, onCheckIn, disabled }) {
  return (
    <button type="button" className="primary-button small" onClick={() => onCheckIn(habitId)} disabled={disabled}>
      {disabled ? 'Checking in...' : 'Check in'}
    </button>
  );
}
