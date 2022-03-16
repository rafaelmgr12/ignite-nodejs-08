import "reflect-metadata";
import request from "supertest";
import { container } from "tsyringe";
import { Connection, createConnection } from "typeorm";

import { CreateUserUseCase } from "@src/modules/users/useCases/createUser/CreateUserUseCase";
import { app } from "@src/app";

let connection: Connection;

describe("Create Statement", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();
  });
  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("Should be able to create new deposit and withdraw statements", async () => {
    const createUser = container.resolve(CreateUserUseCase);
    const user = {
      name: "depositWithdraw",
      email: "depositWithdraw@example.com",
      password: "depositWithdrawPassword",
    };
    const newUser = await createUser.execute(user);
    const userAuth = await request(app).post("/sessions").send({
      email: user.email,
      password: user.password,
    });

    const response1 = await request(app)
      .post("/statements/deposit")
      .send({
        user_id: newUser.id,
        operator: newUser.id,
        amount: 100,
        description: "Deposit 100",
      })
      .set({
        Authorization: `bearer ${userAuth.body.token}`,
      });
    expect(response1.status).toBe(201);
    expect(response1.body).toHaveProperty("amount");
    expect(response1.body.amount).toBe(100);

    const response2 = await request(app)
      .post("/statements/withdraw")
      .send({
        user_id: newUser.id,
        operator: newUser.id,
        amount: 50,
        description: "Withdraw 50",
      })
      .set({
        Authorization: `bearer ${userAuth.body.token}`,
      });
    expect(response2.status).toBe(201);
    expect(response2.body).toHaveProperty("amount");
    expect(response2.body.amount).toBe(50);
  });

  it("Should be able to create new transfer statements", async () => {
    const createUser = container.resolve(CreateUserUseCase);
    const user = {
      name: "transfer1",
      email: "transfer1@example.com",
      password: "userPassword",
    };
    const newUser = await createUser.execute(user);
    const userAuth = await request(app).post("/sessions").send({
      email: user.email,
      password: user.password,
    });
    const user2 = {
      name: "transfer2",
      email: "transfer2@example.com",
      password: "userPassword",
    };
    const newUser2 = await createUser.execute(user2);

    await request(app)
      .post("/statements/deposit")
      .send({
        user_id: newUser.id,
        operator: newUser.id,
        amount: 100,
        description: "Deposit 100",
      })
      .set({
        Authorization: `bearer ${userAuth.body.token}`,
      });

    // const url = "/statements/transfer/" + newUser2.id;
    // console.log(url, newUser.id, newUser2.id, userAuth.body);

    const response = await request(app)
      .post("/statements/transfer/" + newUser2.id)
      .send({
        amount: 50,
        description: "Transfer 50 to user2",
      })
      .set({
        Authorization: `bearer ${userAuth.body.token}`,
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveLength(2);
  });

  it("Should not be able to create new withdraw or transfer statements if funds are not sufficient", async () => {
    const createUser = container.resolve(CreateUserUseCase);
    const user = {
      name: "user5",
      email: "user5@example.com",
      password: "userPassword",
    };
    const newUser = await createUser.execute(user);
    const userAuth = await request(app).post("/sessions").send({
      email: user.email,
      password: user.password,
    });
    const response3 = await request(app)
      .post("/statements/withdraw")
      .send({
        user_id: newUser.id,
        operator: newUser.id,
        amount: 100,
        description: "Withdraw 100",
      })
      .set({
        Authorization: `bearer ${userAuth.body.token}`,
      });
    expect(response3.status).toBe(400);
  });

  it("Should not be able to create new statements if token is not valid", async () => {
    const createUser = container.resolve(CreateUserUseCase);
    const user = {
      name: "user6",
      email: "user6@example.com",
      password: "userPassword",
    };
    const newUser = await createUser.execute(user);
    const response4 = await request(app)
      .post("/statements/withdraw")
      .send({
        user_id: newUser.id,
        operator: newUser.id,
        amount: 100,
        description: "Withdraw 100",
      })
      .set({
        Authorization: "invalidToken",
      });
    expect(response4.status).toBe(401);
  });

  it("Should not be able to create new statements without token", async () => {
    const createUser = container.resolve(CreateUserUseCase);
    const user = {
      name: "user7",
      email: "user7@example.com",
      password: "userPassword",
    };
    const newUser = await createUser.execute(user);
    const response4 = await request(app).post("/statements/withdraw").send({
      user_id: newUser.id,
      operator: newUser.id,
      amount: 100,
      description: "Withdraw 100",
    });
    expect(response4.status).toBe(401);
  });
});