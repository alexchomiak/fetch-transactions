import { TransactionManager } from "./TransactionManager";
import redis, { RedisClient } from "redis";
import process from "process";
import { Transaction } from "./types";
import { mapTransactions } from "./util";

export class RedisManager implements TransactionManager {
    client: RedisClient;
    init() {
        // * Initialize redis client
        this.client = redis.createClient({
            host: process.env.REDIS_URI || "localhost",
            port: 6379,
        });

        // * Set error logs
        this.client.on("error", (err) => {
            console.log("vvv Redis error 🚨 vvv");
            console.error(err);
            process.exit(1);
        });
    }

    private async parseTransactions(user: string) {
        // * Retrieve raw transaction data from Redis
        const rawTransactions: string[] = await new Promise((r, e) =>
            this.client.zrange(
                user,
                0,
                Number.MAX_SAFE_INTEGER,
                (err, data) => {
                    if (err) e(err);
                    r(data);
                }
            )
        );

        // * Parse raw data from Redis
        return rawTransactions.map((rawData) => {
            return JSON.parse(rawData) as Transaction;
        });
    }

    async spendPoints(amount: number, user: string) {
        // * Get transactions
        let transactions = mapTransactions(await this.parseTransactions(user));

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

        // * Commit transactions once verified points can be spent
        await transactionsToAdd.forEach(async (t) => {
            await new Promise((res) =>
                this.client.zadd(
                    user,
                    Date.parse(t.timestamp),
                    JSON.stringify(t),
                    (err) => {
                        if (err) throw err;
                        else res(true);
                    }
                )
            );
        });
        return spent;
    }

    async getBalances(user: string) {
        // * Get transactions
        let transactions = await this.parseTransactions(user);

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
        // * Parse timestamp to milliseconds for zset score
        const score = Date.parse(transaction.timestamp);

        // * Add stringified transaction to Redis
        await new Promise((res) =>
            this.client.zadd(
                user,
                score,
                JSON.stringify(transaction),
                (err) => {
                    if (err) throw err;
                    else res(true);
                }
            )
        );
        return true;
    }
}
