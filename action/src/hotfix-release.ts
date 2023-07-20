import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  generateReleaseNotes,
  getLatestReleaseVersion,
  publishHotfixRelease,
} from "./github-api/release";
import { createHotfixToDevPr } from "./github-api/pr";
import { extractBranchFromRef } from "./utils/ref";

export const createHotfixRelease = async () => {
  const version = await calculateHotfixVersion();
  const releaseNotes = await generateReleaseNotes(version, "main");

  await publishHotfixRelease(version, releaseNotes);

  await createHotfixToDevPr(
    extractBranchFromRef(github.context.ref),
    releaseNotes
  );
};

const calculateHotfixVersion = async () => {
  const latestRelease = await getLatestReleaseVersion();

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
