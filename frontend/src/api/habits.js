const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const errorPayload = await response.json();
      message = errorPayload?.message || errorPayload?.error || message;
    } catch (error) {
      message = `${response.status} ${response.statusText || 'Error'}`;
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.status === 204 ? null : response.text();
}

export async function getHabits() {
  return request('/habits');
}

export async function getHabitById(id) {
  return request(`/habits/${id}`);
}

export async function createHabit(payload) {
  return request('/habits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateHabit(id, payload) {
  return request(`/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteHabit(id) {
  return request(`/habits/${id}`, {
    method: 'DELETE',
    headers: {},
  });
}

export async function getHabitCheckIns(id) {
  return request(`/habits/${id}/check-ins`);
}

export async function createCheckIn(id, checkInDate) {
  return request(`/habits/${id}/check-ins`, {
    method: 'POST',
    body: JSON.stringify({ checkInDate }),
  });
}
