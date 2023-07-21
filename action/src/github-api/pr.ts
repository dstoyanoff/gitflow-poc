import * as core from "@actions/core";
import * as github from "@actions/github";
import { getOctokit } from "../utils/octokit";
import { RequestError } from "@octokit/request-error";
import { OctokitResponse } from "@octokit/types";
import { ErrorResponseData } from "../types";

export const createReleaseToDevPr = async (
  version: string,
  releaseNotes: string
) => {
  core.info(`Creating a release/${version} to dev Pull Request`);

  try {
    const { data: result } = await getOctokit().pulls.create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      base: "dev",
      head: `release/${version}`,
      body: releaseNotes,
      title: `chore(release): Merge release ${version} to dev`,
    });

    core.info("Adding a chore label to the Pull Request");
    return getOctokit().issues.addLabels({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: result.number,
      labels: ["chore"],
    });
  } catch (error) {
    if (!(error instanceof RequestError)) {
      throw error;
    }

    if (
      (error.response as OctokitResponse<ErrorResponseData>)?.data?.errors?.[0]
        .message === `No commits between dev and release/${version}`
    ) {
      core.info(
        "No Pull Request created since the release branch does not contain any commits on top of dev"
      );
      // this is a no-op
      return;
    }

    throw error;
  }
};

export const createHotfixToDevPr = (branch: string, releaseNotes: string) => {
  core.info(`Creating a hotfix to dev Pull Request`);

  return getOctokit().pulls.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    base: "dev",
    head: branch,
    body: releaseNotes,
    title: `chore(hotfix): Merge hotfix to dev`,
  });
};

export const getCommits = async (prNumber: number) => {
  core.info(`Retrieving PR commits for #${prNumber}`);

  const { data: result } = await getOctokit().pulls.listCommits({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  return result;
};
