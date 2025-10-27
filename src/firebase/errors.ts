export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

/**
 * A custom error class to represent Firestore permission errors with rich context.
 * This is used to display detailed error information in the development overlay.
 */
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `Firestore Permission Denied: Cannot ${context.operation.toUpperCase()} on path "${context.path}".`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    
    // This is necessary for Error subclasses in some environments
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
