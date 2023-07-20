import { getToken } from "./inputs";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch-commonjs";

export const getOctokit = () =>
  new Octokit({
    auth: getToken(),
    request: {
      fetch,
    },
  });
