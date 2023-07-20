import * as core from "@actions/core";
import { getCycle, getIsMajor } from "./utils/inputs";
import {
  createDraftRelease,
  generateReleaseNotes,
  getDraftRelease,
  getLatestReleaseVersion,
} from "./github-api/release";
import { createReleaseBranch } from "./github-api/branch";

export const createRelease = async () => {
  const existingDraft = await getDraftRelease();

  if (existingDraft) {
    throw new Error("Another draft release found, please delete it and re-run");
  }

  const version = await calculateReleaseVersion();
  const branch = await createReleaseBranch(version);
  const releaseNotes = await generateReleaseNotes(version, branch);

  await createDraftRelease(version, branch, getCycle(), releaseNotes);
};

const calculateReleaseVersion = async () => {
  const latestRelease = await getLatestReleaseVersion();

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
