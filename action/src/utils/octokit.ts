import { getToken } from "./inputs";
import { Octokit } from "@octokit/rest";

export const getOctokit = () =>
  new Octokit({
    auth: getToken(),
  });
