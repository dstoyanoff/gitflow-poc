import * as core from "@actions/core";
import { getCycle, getIsMajor } from "./utils/inputs";
import { getLatestReleaseVersion } from "./github-api/release";
import {
  createBranch,
  getBranch,
  updateBranchProtection,
} from "./github-api/branch";
import { createPullRequest } from "./github-api/pr";

export const createRelease = async () => {
  const latestRelease = await getLatestReleaseVersion();
  const version = await calculateReleaseVersion(latestRelease);
  const branchName = `release/${version}`;

  const existingReleaseBranch = await getBranch(branchName);

  // idempotency if the branch was already created
  if (existingReleaseBranch) {
    return;
  }

  await createBranch(branchName);

  await updateBranchProtection(branchName, {
    requiredApprovals: 2,
    requireCodeOwnerReviews: true,
    lockBranch: false,
    linearHistory: true,
    // TODO(improve): require merge queue here once the GitHub API supports it
  });

  await createPullRequest(
    branchName,
    "main",
    `chore(release): Release ${version} - Cycle ${getCycle()}`,
    `Release ${version} - Cycle ${getCycle()}`
  );
};

const calculateReleaseVersion = async (latestRelease: string | null) => {
  if (!latestRelease) {
    core.info("Defaulting to v1.0.0 as there is no previous release");
    return "v1.0.0";
  }

  const [major, minor] = latestRelease.substring(1).split(".").map(Number);

  const isMajorVersion = getIsMajor();
  const newMajor = isMajorVersion ? major + 1 : major;
  const newMinor = isMajorVersion ? 0 : minor + 1;

  const newVersion = `v${newMajor}.${newMinor}.0`;

  core.info(`Calculated release version - ${newVersion}`);

  return newVersion;
};
