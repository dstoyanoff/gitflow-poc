export type OperationType =
  | "create_release"
  | "update_release"
  | "publish_release"
  | "hotfix_release";

export type ErrorResponseData = {
  errors: {
    code: string;
    message: string;
  }[];
};
