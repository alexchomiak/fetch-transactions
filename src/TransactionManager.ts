import { Transaction } from "./types";

export interface TransactionManager {
    init: () => void;
    addTransaction(transaction: Transaction, user: string): Promise<boolean>;
    spendPoints(amount: number, user: string): Promise<Object>;
    getBalances(user: string): Promise<Object>;
}
