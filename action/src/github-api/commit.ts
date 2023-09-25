import * as core from "@actions/core";
import * as github from "@actions/github";
import { getOctokit } from "../utils/octokit";

export const createCommit = async (
  tree: string,
  parent: string,
  message: string
) => {
  core.info(`Creating commit`);

  const { data: result } = await getOctokit().git.createCommit({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tree,
    message,
    parents: [parent],
  });

  return result;
};

export const getCommit = async (sha: string) => {
  const { data: result } = await getOctokit().git.getCommit({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    commit_sha: sha,
  });

  return result;
};
