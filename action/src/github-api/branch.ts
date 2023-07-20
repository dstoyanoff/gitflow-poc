import * as core from "@actions/core";
import * as github from "@actions/github";
import { getOctokit } from "../utils/octokit";
import { extractBranchFromRef } from "../utils/ref";

export const createReleaseBranch = async (version: string) => {
  core.info(`Creating branch release/${version}`);

  const { data: result } = await getOctokit().git.createRef({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    ref: `refs/heads/release/${version}`,
    sha: github.context.sha,
  });

  return extractBranchFromRef(result.ref);
};

export const lockReleaseBranch = async (version: string) => {
  core.info(`Marking branch release/${version} as locked`);

  return getOctokit().repos.updateBranchProtection({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    branch: `release/${version}`,
    lock_branch: true,
    // required by the API
    required_status_checks: null,
    enforce_admins: null,
    required_pull_request_reviews: null,
    restrictions: null,
  });
};

export const mergeReleaseToMain = async (version: string) => {
  core.info(`Merging branch release/${version} to main`);

  return getOctokit().repos.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    base: "main",
    head: `release/${version}`,
    commit_message: `Release ${version}`,
  });
};
