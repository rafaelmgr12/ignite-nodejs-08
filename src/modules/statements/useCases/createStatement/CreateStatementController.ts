import { AppError } from "@src/shared/errors/AppError";
import { Request, Response, NextFunction } from "express";
import { container } from "tsyringe";

import { CreateStatementUseCase } from "./CreateStatementUseCase";

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  TRANSFER = "transfer",
}

export class CreateStatementController {
  async execute(request: Request, response: Response) {
    const { id: user_id, id: operator } = request.user;
    const { amount, description } = request.body;

    const splittedPath = request.originalUrl.split("/");
    const type = splittedPath[splittedPath.length - 1] as OperationType;

    if (type === request.params.user_id) {
      const type = OperationType.TRANSFER;
      const { user_id: operator } = request.params;
      const createStatement = container.resolve(CreateStatementUseCase);
      const statement_sender = await createStatement.execute({
        user_id,
        operator,
        type,
        amount,
        description,
      });
      const statement_receiver = await createStatement.execute({
        user_id: operator,
        operator,
        type,
        amount,
        description,
      });
      return response.status(201).json([statement_sender, statement_receiver]);
    }

    const createStatement = container.resolve(CreateStatementUseCase);
    const statement = await createStatement.execute({
      user_id,
      operator,
      type,
      amount,
      description,
    });
    return response.status(201).json(statement);
  }
}
