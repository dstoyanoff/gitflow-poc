import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  generateReleaseNotes,
  getLatestReleaseVersion,
  createRelease,
} from "./github-api/release";
import { createPullRequest, getPullRequestCommits } from "./github-api/pr";
import {
  createBranch,
  getBranch,
  merge,
  updateBranchSha,
} from "./github-api/branch";
import { createCommit } from "./github-api/commit";

export const createHotfixRelease = async () => {
  const latestRelease = await getLatestReleaseVersion();
  const version = await calculateHotfixVersion(latestRelease);
  const releaseNotes = await generateReleaseNotes(
    version,
    "main",
    latestRelease
  );

  await createRelease(
    version,
    "main",
    `Release ${version} - Hotfix`,
    releaseNotes,
    false
  );

  if (!github.context.payload.pull_request) {
    throw new Error("There is no pull_request in the payload");
  }

  const prNumber = github.context.payload.pull_request.number;
  const commits = await getPullRequestCommits(prNumber);
  const devBranch = await getBranch("dev");
  const choreBranchName = `chore/hotfix-merge-${prNumber}`;

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

  const parentSha = commits[0].parents[0].sha;
  const tempCommit = await createCommit(branchTree, parentSha, "temp");

  core.info(`Created temp commit ${tempCommit.sha} (parent: ${parentSha})`);

  await updateBranchSha(choreBranchName, tempCommit.sha);

  const mergeOp = await merge(commits[0].sha, choreBranchName);
  const mergeTreeSha = mergeOp.commit.tree.sha;

  const cherry = await createCommit(mergeTreeSha, branchSha, "looks good!");

  await updateBranchSha(choreBranchName, cherry.sha);

  await createPullRequest(
    choreBranchName,
    "dev",
    `chore(hotfix): Merge hotfix ${prNumber} to dev`,
    releaseNotes
  );
};

const calculateHotfixVersion = async (latestRelease: string | null) => {
  if (!latestRelease) {
    throw new Error("Can't create a hotfix as there are no published releases");
  }

  const [major, minor, patch] = latestRelease
    .substring(1)
    .split(".")
    .map(Number);

  const newVersion = `v${major}.${minor}.${patch + 1}`;
  core.info(`Calculated hotfix version - ${newVersion}`);

  return newVersion;
};
