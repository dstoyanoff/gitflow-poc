import * as github from "@actions/github";
import {
  createBranch,
  getBranch,
  merge,
  updateBranchSha,
} from "./github-api/branch";
import * as core from "@actions/core";
import { createCommit, getCommit } from "./github-api/commit";
import { createPullRequest, getPullRequestsByCommit } from "./github-api/pr";
import { extractBranchFromRef } from "./utils/ref";

export async function updateRelease() {
  const commit = await getCommit(github.context.sha);
  const pr = await getPr();

  const choreBranchName = `chore/hotfix-merge-${pr.number}`;
  const newBranch = await createChoreBranch(choreBranchName, commit.sha);

  if (!newBranch) {
    return;
  }

  const branchSha = newBranch.commit.sha;
  const branchTree = newBranch.commit.commit.tree.sha;
  core.info(
    `Created branch ${choreBranchName} (sha: ${branchSha}, tree: ${branchTree})`
  );

  console.dir(commit.parents, { depth: null });
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
    `chore(release): Merge release fix ${pr.number} to dev`,
    pr.body ?? commit.message
  );
}

async function getPr() {
  const prs = await getPullRequestsByCommit(github.context.sha);

  const pr = prs.find(
    (pr) => pr.base.ref === extractBranchFromRef(github.context.ref)
  );

  if (!pr) {
    throw new Error(`Could not find PR for ref ${github.context.ref}`);
  }

  return pr;
}

async function createChoreBranch(name: string, fixCommitSha: string) {
  const devBranch = await getBranch("dev");

  if (!devBranch) {
    throw new Error("Dev branch not resolved");
  }

  // when creating the release PR, the push gets triggered,
  // but at that point we should not create a dev PR as there is no commit difference
  if (devBranch.commit.sha === fixCommitSha) {
    core.info("No diff to dev, so no PR will be opened");
    return null;
  }

  await createBranch(name, devBranch.commit.sha);
  return getBranch(name);
}
