import * as core from "@actions/core";
import * as github from "@actions/github";
import { getOctokit } from "../utils/octokit";

export const createReleaseToDevPr = async (
  version: string,
  releaseNotes: string
) => {
  core.info(`Creating a release/${version} to dev Pull Request`);
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
};
