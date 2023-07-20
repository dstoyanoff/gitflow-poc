import * as core from "@actions/core";
import * as github from "@actions/github";
import { getOctokit } from "../utils/octokit";

export const getDraftRelease = async () => {
  core.info("Retrieving an existing draft release");

  const octokit = getOctokit();

  const releases = await octokit.paginate(octokit.repos.listReleases, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    per_page: 100,
  });

  const draftReleases = releases.filter((r) => r.draft);

  if (draftReleases.length > 1) {
    // if there is more than 1 draft release, we can't find out which one to update/publish
    throw new Error("Found more than 1 draft release. This is not supported!");
  }

  return draftReleases.at(0);
};

export const getLatestReleaseVersion = async () => {
  core.info("Retrieving the last published release");

  try {
    const { data: release } = await getOctokit().repos.getLatestRelease({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    });

    return release.tag_name;
  } catch {
    // the first time we execute the action, there won't be an existing release
    return null;
  }
};

export const generateReleaseNotes = async (
  version: string,
  targetBranch: string
) => {
  core.info(
    `Generating release notes for ${version} (branch: ${targetBranch})`
  );

  const latestRelease = await getLatestReleaseVersion();

  const { data: result } = await getOctokit().repos.generateReleaseNotes({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tag_name: version,
    target_commitish: targetBranch,
    ...(latestRelease && {
      previous_tag_name: latestRelease,
    }),
  });

  return result.body;
};

export const createDraftRelease = (
  version: string,
  releaseBranch: string,
  cycle: number,
  releaseNotes: string
) => {
  core.info(
    `Creating draft release ${version} (branch: ${releaseBranch}, cycle: ${cycle})`
  );

  return getOctokit().repos.createRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tag_name: version,
    target_commitish: releaseBranch,
    name: `Release ${version} - Cycle ${cycle}`,
    draft: true,
    body: releaseNotes,
  });
};

export const updateDraftRelease = (
  releaseId: number,
  version: string,
  releaseBranch: string,
  releaseNotes: string
) => {
  core.info(
    `Updating draft release ${releaseId} (version: ${version}, branch: ${releaseBranch})`
  );

  return getOctokit().repos.updateRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tag_name: version,
    release_id: releaseId,
    body: releaseNotes,
  });
};

export const publishDraftRelease = async (releaseId: number) => {
  core.info(`Publishing draft release ${releaseId}`);

  return getOctokit().repos.updateRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    release_id: releaseId,
    draft: false,
  });
};

export const publishHotfixRelease = async (
  version: string,
  releaseNotes: string
) => {
  core.info(`Publishing a hotfix release ${version}`);

  return getOctokit().repos.createRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tag_name: version,
    target_commitish: "main",
    name: `Hotfix ${version}`,
    body: releaseNotes,
  });
};
