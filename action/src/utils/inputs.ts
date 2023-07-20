import * as core from "@actions/core";
import { OperationType } from "../types";

export const getToken = () => {
  const token = core.getInput("token");

  if (!token) {
    throw new Error("<token> input not provided");
  }

  return token;
};

export const getOperation = () => {
  const operation = core.getInput("operation") as OperationType;

  if (!operation) {
    throw new Error(
      "<operation> input not provided. Please set to one of: create_release | update_release | publish_release"
    );
  }

  return operation;
};

export const getIsMajor = () => core.getBooleanInput("major");

export const getCycle = () =>
  Number.parseInt(core.getInput("cycle", { required: true }));
