import { customLog } from "../utils";
import { DatabaseError } from "./db-helper";

export type RepositoryResponse<T> = {
  success: boolean;
  error: string;
  result: T;
}

export class RepositoryBase {
  
  private getClassName() {
    return this.constructor.name;
  }

  handleError(error: any): RepositoryResponse<any> {
    customLog(this.getClassName(), error);

    if (error instanceof DatabaseError) {
      throw error;
    }

    return {
      success: false,
      error: 'Internal Server Error!',
      result: {},
    }
  }

  failure(reason: string): RepositoryResponse<any> {
    return {
      success: false,
      error: reason,
      result: {},
    }
  }

  success(data: any): RepositoryResponse<any> {
    return {
      success: true,
      error: '',
      result: data,
    }
  }
}