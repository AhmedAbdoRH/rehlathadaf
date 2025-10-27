import Emitter from 'tiny-emitter';

// A simple event emitter for cross-component communication.
// This is particularly useful for handling errors from services/hooks
// and displaying them in a central UI component (like a toaster).
export const errorEmitter = new Emitter();
