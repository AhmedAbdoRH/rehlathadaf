
export type Project = 'rehlethadaf' | 'pova' | 'other';

export type Domain = {
  id?: string; // Firestore uses string IDs
  domainName: string;
  status: 'active' | 'inactive';
  collectionDate: string; // ISO 8601 format
  renewalDate: string | Date; // Allow Date for component state, string for DB
  dataSheet: string;
  outstandingBalance?: number;
  renewalCostClient: number | '';
  renewalCostOffice: number | '';
  renewalCostPova?: number | '';
  projects?: Project[];
};

export type Todo = {
  id?: string;
  domainId: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO 8601 string
};

export type ApiKeyStatus = {
  key: string;
  name: string;
  status: 'checking' | 'online' | 'offline';
};
