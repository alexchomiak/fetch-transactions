import axios from "axios";
import { main } from "../app";
import process from 'process'
let server;
beforeEach(async () => {

    server = await main(9999, "MEMORY");
});

afterEach(async () => {
    await new Promise<void>((resolve) => {
        server.close((err) => {
            if (err) throw err;
            resolve();
        });
    });
});

test("PDF Specification", async () => {
    // * Make requests
    await axios.post("http://localhost:9999/transaction", {
        payer: "DANNON",
        points: 1000,
        timestamp: "2020-11-02T14:00:00Z",
    });
    await axios.post("http://localhost:9999/transaction", {
        payer: "UNILEVER",
        points: 200,
        timestamp: "2020-10-31T11:00:00Z",
    });
    await axios.post("http://localhost:9999/transaction", {
        payer: "DANNON",
        points: -200,
        timestamp: "2020-10-31T15:00:00Z",
    });
    await axios.post("http://localhost:9999/transaction", {
        payer: "MILLER COORS",
        points: 10000,
        timestamp: "2020-11-01T14:00:00Z",
    });
    await axios.post("http://localhost:9999/transaction", {
        payer: "DANNON",
        points: 300,
        timestamp: "2020-10-31T10:00:00Z",
    });

    // * Check initial balance
    const initialBalance = (await axios.get("http://localhost:9999/balance"))
        .data;
    expect(initialBalance["DANNON"]).toBe(1100);
    expect(initialBalance["UNILEVER"]).toBe(200);
    expect(initialBalance["MILLER COORS"]).toBe(10000);
    // * Spend 5000 && check result
    const spendResult = (
        await axios.post("http://localhost:9999/spend", {
            points: 5000,
        })
    ).data;
    expect(spendResult["DANNON"]).toBe(-100);
    expect(spendResult["UNILEVER"]).toBe(-200);
    expect(spendResult["MILLER COORS"]).toBe(-4700);

    // * Check final balance
    const finalBalance = (await axios.get("http://localhost:9999/balance"))
        .data;
    expect(finalBalance["DANNON"]).toBe(1000);
    expect(finalBalance["UNILEVER"]).toBe(0);
    expect(finalBalance["MILLER COORS"]).toBe(5300);
});

test("User data kept seperate", async () => {
    // * Make requests
    await axios.post("http://localhost:9999/transaction", {
        payer: "DANNON",
        points: 1000,
        timestamp: "2020-11-02T14:00:00Z",
        user: "a",
    });
    await axios.post("http://localhost:9999/transaction", {
        payer: "DANNON",
        points: 500,
        timestamp: "2020-11-02T15:00:00Z",
        user: "b",
    });

    // * Verify user data kept seperate
    const aBalance = (await axios.get("http://localhost:9999/balance?user=a"))
        .data;
    expect(aBalance["DANNON"]).toBe(1000);
    const bBalance = (await axios.get("http://localhost:9999/balance?user=b"))
        .data;
    expect(bBalance["DANNON"]).toBe(500);
});

test("Error when trying to spend too many points", async () => {
    // * Make requests
    await axios.post("http://localhost:9999/transaction", {
        payer: "DANNON",
        points: 1000,
        timestamp: "2020-11-02T14:00:00Z",
    });

    // * Try to spend more points than you have
    await expect(
        axios.post("http://localhost:9999/spend", {
            points: 5000,
        })
    ).rejects.toThrow("Request failed with status code 400");
});
