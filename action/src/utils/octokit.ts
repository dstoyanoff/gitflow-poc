import { getToken } from "./inputs";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";

export const getOctokit = () =>
  new Octokit({
    auth: getToken(),
    request: {
      fetch,
    },
  });
