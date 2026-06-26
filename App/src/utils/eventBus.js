const STORAGE_KEY = 'task-unassigned-event';

const eventTarget = new EventTarget();

function emitTaskUnassignedEvent(detail) {
  eventTarget.dispatchEvent(new CustomEvent('taskUnassigned', { detail }));
}

export function emitTaskUnassigned(taskId, complaintId) {
  const eventDetail = { taskId, complaintId, timestamp: Date.now() };
  emitTaskUnassignedEvent(eventDetail);

  try {
    window.dispatchEvent(new CustomEvent('taskUnassigned', { detail: eventDetail }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventDetail));
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // localStorage may be unavailable in some environments; ignore if so.
    console.warn('Could not emit taskUnassigned storage event:', error);
  }
}

export function onTaskUnassigned(callback) {
  const handler = (event) => callback(event.detail);
  eventTarget.addEventListener('taskUnassigned', handler);

  const storageHandler = (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const detail = JSON.parse(event.newValue);
      callback(detail);
    } catch (error) {
      console.warn('Invalid taskUnassigned storage payload', error);
    }
  };

  window.addEventListener('storage', storageHandler);

  return () => {
    eventTarget.removeEventListener('taskUnassigned', handler);
    window.removeEventListener('storage', storageHandler);
  };
}
