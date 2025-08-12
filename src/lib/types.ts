export type Domain = {
  id: number;
  domainName: string;
  status: 'active' | 'inactive';
  collectionDate: string; // ISO 8601 format
  renewalDate: string; // ISO 8601 format
  clientName: string;
  clientEmail: string;
  registrar: string;
  outstandingBalance: number;
  renewalCostClient: number;
  renewalCostOffice: number;
};
