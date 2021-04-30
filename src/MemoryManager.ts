import { TransactionManager } from "./TransactionManager";
import { Transaction } from "./types";
import Heap from "heap";
import { mapTransactions } from "./util";

export class MemoryManager implements TransactionManager {
    heaps: Map<string, Heap<Transaction>>;

    init() {
        // * Initialize heaps map
        this.heaps = new Map<string, Heap<Transaction>>();
    }

    private getTransactions(user: string) {
        // * Grab heap
        if (!this.heaps[user])
            this.heaps[user] = new Heap<Transaction>(
                (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
            );
        let heap: Heap<Transaction> = this.heaps[user];

        // * Remove all elements from heap and copy into array
        let transactions: Transaction[] = [];
        while (heap.size() > 0) {
            transactions.push(heap.pop());
        }

        // * Push back into heap
        transactions.forEach((t) => heap.push({ ...t }));

        // * Return array of transactions
        return transactions;
    }

    async spendPoints(amount, user: string) {
        // * Grab heap, create if it doesn't exist
        if (!this.heaps[user])
            this.heaps[user] = new Heap<Transaction>(
                (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
            );

        let heap: Heap<Transaction> = this.heaps[user];

        // * Get transactions
        let transactions = mapTransactions(this.getTransactions(user));

        let currentAmount = amount;
        let idx = 0;
        let spent = {};
        let transactionsToAdd: Transaction[] = [];
        while (currentAmount > 0 && idx < transactions.length) {
            // * Grab transaction and calculate subtraction amount
            let transaction = transactions[idx];

            // * Skip negative & zero transactions
            if (transaction.points_available <= 0) {
                idx += 1;
                continue;
            }

            // * Determine amount to subtract
            let subtractAmount = Math.min(
                currentAmount,
                transaction.points_available
            );

            // * Update spent map
            if (!spent[transaction.payer]) spent[transaction.payer] = 0;
            spent[transaction.payer] -= subtractAmount;

            // * Create and add new transaction to redis store
            const t: Transaction = {
                timestamp: new Date(Date.now()).toISOString(),
                payer: transaction.payer,
                points: subtractAmount * -1,
            };
            transactionsToAdd.push(t);

            idx += 1;
            currentAmount -= subtractAmount;
        }

        if (currentAmount > 0) throw new Error("Not enough points available");
        transactionsToAdd.forEach((t) => heap.push(t));
        return spent;
    }

    async getBalances(user: string) {
        // * Grab transactions
        let transactions = this.getTransactions(user);

        // * Sum balances into balance map
        let balanceMap = {};
        transactions.forEach((transaction) => {
            if (balanceMap[transaction.payer] == undefined)
                balanceMap[transaction.payer] = 0;
            balanceMap[transaction.payer] += transaction.points;
        });

        return balanceMap;
    }

    async addTransaction(transaction: Transaction, user: string) {
        // * Grab heap, create if it doesn't exist
        if (!this.heaps[user])
            this.heaps[user] = new Heap<Transaction>(
                (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
            );

        let heap: Heap<Transaction> = this.heaps[user];

        // * Push transaction to heap
        heap.push(transaction);
        return true;
    }
}
