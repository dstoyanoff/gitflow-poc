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

export const createPullRequest = (
  from: string,
  to: string,
  title: string,
  body: string
) => {
  core.info(`Creating pull request <${title}> from <${from}> to <${to}>`);

  return getOctokit().pulls.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    base: to,
    head: from,
    body,
    title,
  });
};

export const getPullRequestCommits = async (prNumber: number) => {
  core.info(`Retrieving PR commits for <#${prNumber}>`);

  const { data: result } = await getOctokit().pulls.listCommits({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  return result;
};

export const getPullRequestByCommit = async (sha: string) => {
  core.info(`Retriever PR for sha <${sha}>`);

  const { data: result } =
    await getOctokit().repos.listPullRequestsAssociatedWithCommit({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      commit_sha: sha,
    });

  const pr = result[0];
  core.info(`Found PR <#${pr.number} ${pr.title}>\n${pr.body}`);

  return pr;
};
