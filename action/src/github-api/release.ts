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
  tag: string,
  targetBranch: string,
  previousTag?: string | null
) => {
  core.info(`Generating release notes for ${tag} (branch: ${targetBranch})`);

  const { data: result } = await getOctokit().repos.generateReleaseNotes({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tag_name: tag,
    target_commitish: targetBranch,
    ...(previousTag && {
      previous_tag_name: previousTag,
    }),
  });

  return result.body;
};

export const createRelease = (
  tagName: string,
  targetBranch: string,
  name: string,
  releaseNotes: string,
  draft: boolean
) => {
  core.info(
    `Creating draft release ${name} (branch: ${targetBranch}, tag: ${tagName})`
  );

  return getOctokit().repos.createRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tag_name: tagName,
    target_commitish: targetBranch,
    name,
    draft,
    body: releaseNotes,
  });
};

export const updateRelease = (
  releaseId: number,
  tagName: string,
  releaseNotes: string,
  draft: boolean
) => {
  core.info(`Updating release ${releaseId} (tag: ${tagName})`);

  return getOctokit().repos.updateRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tag_name: tagName,
    release_id: releaseId,
    draft,
    body: releaseNotes,
  });
};

export const publishRelease = async (releaseId: number) => {
  core.info(`Publishing draft release ${releaseId}`);

  return getOctokit().repos.updateRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    release_id: releaseId,
    draft: false,
  });
};
