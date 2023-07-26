import * as github from "@actions/github";
import {
  createBranch,
  getBranch,
  merge,
  updateBranchSha,
} from "./github-api/branch";
import * as core from "@actions/core";
import { createCommit, getCommit } from "./github-api/commit";
import { createPullRequest } from "./github-api/pr";

export const updateRelease = async () => {
  if (!github.context.payload.pull_request) {
    throw new Error("There is no pull_request in the payload");
  }

  const prNumber = github.context.payload.pull_request.number;
  // const mergeCommitSha =
  const choreBranchName = `chore/hotfix-merge-${prNumber}`;

  const devBranch = await getBranch("dev");

  if (!devBranch) {
    throw new Error("Dev branch not resolved");
  }

  await createBranch(choreBranchName, devBranch.commit.sha);
  const newBranch = await getBranch(choreBranchName);

  if (!newBranch) {
    throw new Error(`Branch ${choreBranchName} not resolved`);
  }

  const branchSha = newBranch.commit.sha;
  const branchTree = newBranch.commit.commit.tree.sha;
  core.info(
    `Created branch ${choreBranchName} (sha: ${branchSha}, tree: ${branchTree})`
  );

  const commit = await getCommit(github.context.sha);
  const parentSha = commit.parents[0].sha;
  const tempCommit = await createCommit(branchTree, parentSha, "temp");

  core.info(`Created temp commit ${tempCommit.sha} (parent: ${parentSha})`);

  await updateBranchSha(choreBranchName, tempCommit.sha);

  const mergeOp = await merge(commit.sha, choreBranchName);
  const mergeTreeSha = mergeOp.commit.tree.sha;

  const cherry = await createCommit(mergeTreeSha, branchSha, "looks good!");

  await updateBranchSha(choreBranchName, cherry.sha);

  await createPullRequest(
    choreBranchName,
    "dev",
    `chore(release): Merge release fix ${prNumber} to dev`,
    commit.message
  );
};
