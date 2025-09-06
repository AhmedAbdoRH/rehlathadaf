export type Project = 'rehlethadaf' | 'bofa' | 'other';

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
  projects?: Project[];
};

    