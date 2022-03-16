import { Statement } from "../../entities/Statement";

export type ICreateStatementDTO = Pick<
  Statement,
  "user_id" | "operator" | "description" | "amount" | "type"
>;
