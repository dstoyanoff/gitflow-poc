import * as github from "@actions/github";
import {
  generateReleaseNotes,
  getDraftRelease,
  getLatestReleaseVersion,
  updateRelease as updateGitHubRelease,
} from "./github-api/release";
import {
  extractBranchFromRef,
  extractReleaseVersionFromRef,
} from "./utils/ref";

export const updateRelease = async () => {
  const version = extractReleaseVersionFromRef(github.context.ref);
  const branch = extractBranchFromRef(github.context.ref);
  const release = await getDraftRelease();
  const latestRelease = await getLatestReleaseVersion();

  if (!release) {
    throw new Error(
      "There is no draft release. Are you missing the create step?"
    );
  }

  const releaseNotes = await generateReleaseNotes(
    version,
    branch,
    latestRelease
  );

  await updateGitHubRelease(release.id, version, releaseNotes, true);
};
