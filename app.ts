import express, { Request, Response } from "express";
import { MemoryManager } from "./src/MemoryManager";
import { RedisManager } from "./src/RedisManager";
import { TransactionManager } from "./src/TransactionManager";
import { Transaction } from "./src/types";

export async function main(app_port?: number, manager_type?: string) {
    // * Initialize express app
    const app = express();
    const port = app_port || process.env.PORT || 12345;
    app.use(express.json());

    // * Initialize transaction manager
    let manager: TransactionManager;
    const managerType = manager_type|| process.env.MANAGER_TYPE || "MEMORY";
    console.log(`Initializing transaction manager of type: ${managerType} 🤖`);
    switch (managerType) {
        case "REDIS":
            manager = new RedisManager();
            break;
        case "MEMORY":
        default:
            if (managerType != "MEMORY")
                console.log(
                    "Manager type not found. Defaulting to in-memory manager 🧬"
                );
            manager = new MemoryManager();
            break;
    }
    manager.init();

    // * Bind routes
    /*
        * HTTP GET /points?user
        ! return balance for User
        ? (user parameter is optional as query parameter, defaults to fetch)
    */
    app.get("/balance", async (req: Request, res: Response) => {
        const user = (req.query["user"] as string) || "fetch";
        try {
            const balances = await manager.getBalances(user);
            res.status(200).send(balances);
        } catch (err) {
            res.status(500).send("Error retrieving balances");
        }
    });

    /*
        * HTTP post /transaction
        !  save transaction for user
        ? (user parameter is optional in post body, defaults to fetch)
    */
    app.post("/transaction", async (req: Request, res: Response) => {
        const user = (req.body?.user as string) || "fetch";
        const transaction = req.body as Transaction;
        try {
            if (await manager.addTransaction(transaction, user))
                res.status(200).send("OK");
            else
                res.status(400).send(
                    "Error posting transaction, is it the correct format?"
                );
        } catch (err) {
            res.status(500).send(
                "Error posting transaction, is it the correct format?\n" +
                    err.toString()
            );
        }
    });

    /*
        * HTTP post /add
        ! add/subtract points to existing payer
        ? (user parameter is optional in post body, defaults to fetch)
    */
    app.post("/add", async (req: Request, res: Response) => {
        const user = (req.body?.user as string) || "fetch";
        const transaction: Transaction = {
            ...req.body,
            timestamp: new Date(Date.now()).toISOString(),
        };
        try {
            if (await manager.addTransaction(transaction, user))
                res.status(200).send("OK");
            else
                res.status(400).send(
                    "Error posting transaction, is it the correct format?"
                );
        } catch (err) {
            res.status(500).send(
                "Error posting transaction.\n" + err.toString()
            );
        }
    });

    /*
        * HTTP post /spend
        ! spend points for user
        ? (user parameter is optional in post body, defaults to fetch)
    */
    app.post("/spend", async (req: Request, res: Response) => {
        const user = (req.body["user"] as string) || "fetch";
        const points = (req.body["points"] as number) || 0;
        try {
            const result = await manager.spendPoints(points, user);
            res.status(200).send(result);
        } catch (err) {
            res.status(400).send(err.toString());
        }
    });

    // * Start application server
    return app.listen(port, () => {
        console.log(`API started 🚀 on port ${port}`);
    });
}

main();
