export type Domain = {
  id?: string; // Firestore uses string IDs
  domainName: string;
  status: 'active' | 'inactive';
  collectionDate: string; // ISO 8601 format
  renewalDate: string; // ISO 8601 format
  clientEmail: string;
  registrar: string;
  outstandingBalance: number;
  renewalCostClient: number;
  renewalCostOffice: number;
};

    