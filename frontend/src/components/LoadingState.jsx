export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="loading-state" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
