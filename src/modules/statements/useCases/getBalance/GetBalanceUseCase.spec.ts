import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetBalanceUseCase } from "./GetBalanceUseCase";
import { OperationType } from "../../entities/Statement";
import { IGetBalanceDTO } from "./IGetBalanceDTO";
import { AppError } from "../../../../shared/errors/AppError";

let createUserUseCase: CreateUserUseCase;
let getBalanceUseCase: GetBalanceUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let createStatementUseCase: CreateStatementUseCase;
let inMemoryUsersRepository: InMemoryUsersRepository;
let inMemoryStatementsRepository: InMemoryStatementsRepository;

describe("Get a Balance", () => {
  beforeEach(() => {
    inMemoryStatementsRepository = new InMemoryStatementsRepository();
    inMemoryUsersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(inMemoryUsersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(
      inMemoryUsersRepository
    );
    getBalanceUseCase = new GetBalanceUseCase(
      inMemoryStatementsRepository,
      inMemoryUsersRepository
    );
    createStatementUseCase = new CreateStatementUseCase(
      inMemoryUsersRepository,
      inMemoryStatementsRepository
    );
  });

  it("Should be able to show an user balance", async () => {
    const newUser: ICreateUserDTO = {
      name: "User1",
      email: "user1@example.com",
      password: "userPassword",
    };
    const user: any = await createUserUseCase.execute(newUser);

    const statement1: ICreateStatementDTO = {
      user_id: user.id,
      type: OperationType.DEPOSIT,
      amount: 100,
      description: "Deposit 100",
    };
    await createStatementUseCase.execute(statement1);
    const statement2: ICreateStatementDTO = {
      user_id: user.id,
      type: OperationType.WITHDRAW,
      amount: 50,
      description: "Withdraw 50",
    };
    await createStatementUseCase.execute(statement2);
    const getBalance1: IGetBalanceDTO = {
      user_id: user.id,
    };
    const result = await getBalanceUseCase.execute(getBalance1);
    expect(result.balance).toBe(50);

    expect(async () => {
      const statement3: ICreateStatementDTO = {
        user_id: user.id,
        type: OperationType.WITHDRAW,
        amount: 100,
        description: "Withdraw 50",
      };
      await createStatementUseCase.execute(statement3);
      const getBalance2: IGetBalanceDTO = {
        user_id: user.id,
      };
      await getBalanceUseCase.execute(getBalance2);
    }).rejects.toBeInstanceOf(AppError);

    expect(async () => {
      const getBalance3: IGetBalanceDTO = {
        user_id: "invalidUser",
      };
      await getBalanceUseCase.execute(getBalance3);
    }).rejects.toBeInstanceOf(AppError);
  });
});

