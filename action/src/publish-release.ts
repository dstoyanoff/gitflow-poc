import {
  getDraftRelease,
  publishRelease as publishGitHubRelease,
} from "./github-api/release";
import { lockBranch, merge } from "./github-api/branch";
import { createReleaseToDevPr } from "./github-api/pr";

export const publishRelease = async () => {
  const release = await getDraftRelease();

  if (!release) {
    throw new Error(
      "There is no draft release. Are you missing the create step?"
    );
  }

  await publishGitHubRelease(release.id);
  await merge(`release/${release.tag_name}`, "main", release.body);
  await lockBranch(`release/${release.tag_name}`);
  await createReleaseToDevPr(release.tag_name, release.body ?? "");
};
