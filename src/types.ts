export interface Transaction {
    payer: string;
    points: number;
    timestamp: string;
}

export interface MappedTransaction extends Transaction {
    points_available: number;
}
