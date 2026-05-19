export interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type OperatorPublic = Operator;

export interface CreateOperatorInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UpdateOperatorInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}
