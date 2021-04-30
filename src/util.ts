import { Transaction, MappedTransaction } from "./types";

export const mapTransactions = (transactions: Transaction[]) => {
    /*
            TLDR: This algorithm greedily populates a points_available trait from the transactions in most recent -> oldest order
            If we see a negative point value for transactions, 
        */

    // * Reverse so most recent is first
    transactions.reverse();

    // * Initialize deductions map
    let deductions = {};

    // * Map transactions array to MappedTransaction array (includes points_available attribute for alg)
    const mapped = transactions.map((transaction: Transaction) => {
        // * Create MappedTransaction from transaction
        let mapped: MappedTransaction = {
            ...transaction,
            points_available: transaction.points,
        };

        if (deductions[transaction.payer] == undefined)
            deductions[transaction.payer] = 0;

        // * If pending deduction, deduct from current transactions points available
        if (deductions[transaction.payer] < 0) {
            mapped.points_available =
                transaction.points + deductions[transaction.payer];
        }

        // * Set deduction if negative transaction value
        if (transaction.points < 0) {
            deductions[transaction.payer] += transaction.points;
        } else if (
            deductions[transaction.payer] < 0 &&
            transaction.points > 0
        ) {
            // * Increment deduction
            deductions[transaction.payer] = Math.min(
                transaction.points + deductions[transaction.payer],
                0
            );
        }

        return mapped;
    });
    // * Reverse back, so oldest is first
    mapped.reverse();

    return mapped;
};
