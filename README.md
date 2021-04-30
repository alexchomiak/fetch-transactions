# Fetch Transaction Manager
I have written two implementations of the transaction manager specified. One that uses an in memory data store that is non-persistent, and one that is built backed by Redis. This API was built to be modular and easily extensible to other backing stores. 

## How does the algorithm work for the spend route?
I took a greedy approach when designing the algorithm to decide how to allocate points to send from transaction. It loops through each transaction starting at the newest and ending at the oldest. In each transaction we will keep track of a points_available attribute, if there is a negative points value for a transaction the algorithm will keep note of it, and the next positive point value transaction it will deduct from its points_available attribute. Once we have mapped the transactions to all have the points_available flag set, we can start at the oldest transaction allocating the points available until we reach the number of desired points spent.

## Getting started
To run the Transaction Manager using an in memory data store, run the following command:
```
docker-compose up -d
```
To get the environment up and running you will need Docker & Docker-Compose installed. Once you have the necessary dependencies installed you can run the following command to start the service:
```
docker-compose --file docker-compose-redis.yml up -d
```

Once you have the service running using Docker,  you should be able to make API requests to http://localhost:8080.
Here are the routes exposed by the application:
| Route             | Description                                                                                                                                                                                                   |
|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| GET /points?user  | return points balance for user, user query param optional (defaults to "fetch")                                                                                                                               |
| POST /transaction | save transaction for user, user param in body is optional (defaults to "fetch")                                                                                                                               |
| POST /spend       | spend specified points for user, user param in body is optional (defaults to "fetch")                                                                                                                         |
| POST /add         | add transaction with current ISO timestamp with specified points and payee for user, user param in body is optional (defaults to "fetch"). NOTE: this was not in the specification but was useful for testing |

## Cleanup
To clean up the environment setup by Docker to run the program, run the following command:
```
docker-compose down 
```
And for the Redis environment:
```
docker-compose --file docker-compose-redis.yml down -v
```

## Development
To begin development you will need the NodeJS runtime installed, once you have NodeJS installed run the following command:
```
npm install
```
Once the dependencies for the project are installed you can use the following commands for building, testing, and serving the API:
```
npm run build # build the project
npm run test  # run test cases 
npm run build && node build/app.js # Build and run the API
```