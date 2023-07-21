import * as core from "@actions/core";
import { getCycle, getIsMajor } from "./utils/inputs";
import {
  createRelease as createGitHubRelease,
  generateReleaseNotes,
  getDraftRelease,
  getLatestReleaseVersion,
} from "./github-api/release";
import { createBranch } from "./github-api/branch";

export const createRelease = async () => {
  const existingDraft = await getDraftRelease();

  if (existingDraft) {
    throw new Error("Another draft release found, please delete it and re-run");
  }

  const latestRelease = await getLatestReleaseVersion();
  const version = await calculateReleaseVersion(latestRelease);
  const branchName = `release/${version}`;

  await createBranch(branchName);

  const releaseNotes = await generateReleaseNotes(
    version,
    branchName,
    latestRelease
  );

  await createGitHubRelease(
    version,
    branchName,
    `Release ${version} - Cycle ${getCycle()}`,
    releaseNotes,
    true
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
