const frequencyOptions = ['DAILY', 'WEEKLY', 'MONTHLY'];

export default function HabitForm({
  values,
  errors,
  isSubmitting,
  mode,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form className="habit-form" onSubmit={onSubmit} noValidate>
      <div className="form-header">
        <div>
          <p className="eyebrow">{mode === 'create' ? 'New habit' : 'Edit habit'}</p>
          <h2>{mode === 'create' ? 'Create a habit' : 'Update habit'}</h2>
        </div>
        {mode === 'edit' && (
          <button type="button" className="text-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      <label htmlFor="habit-name">Name</label>
      <input
        id="habit-name"
        name="name"
        type="text"
        value={values.name}
        onChange={onChange}
        placeholder="Morning run"
        aria-invalid={Boolean(errors.name)}
      />
      {errors.name && <p className="field-error">{errors.name}</p>}

      <label htmlFor="habit-description">Description</label>
      <textarea
        id="habit-description"
        name="description"
        value={values.description}
        onChange={onChange}
        rows="4"
        placeholder="Short description of your goal"
        aria-invalid={Boolean(errors.description)}
      />
      {errors.description && <p className="field-error">{errors.description}</p>}

      <label htmlFor="habit-frequency">Frequency</label>
      <select
        id="habit-frequency"
        name="frequency"
        value={values.frequency}
        onChange={onChange}
        aria-invalid={Boolean(errors.frequency)}
      >
        {frequencyOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {errors.frequency && <p className="field-error">{errors.frequency}</p>}

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create habit' : 'Save changes'}
      </button>
    </form>
  );
}
