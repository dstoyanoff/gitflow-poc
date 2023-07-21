import {
  getDraftRelease,
  publishRelease as publishGitHubRelease,
} from "./github-api/release";
import { merge, updateBranchProtection } from "./github-api/branch";
import { createReleaseToDevPr } from "./github-api/pr";

export const publishRelease = async () => {
  const release = await getDraftRelease();

  if (!release) {
    throw new Error(
      "There is no draft release. Are you missing the create step?"
    );
  }

  const releaseBranch = `release/${release.tag_name}`;
  await publishGitHubRelease(release.id);
  await merge(releaseBranch, "main", release.body);
  await updateBranchProtection(releaseBranch, {
    lockBranch: true,
  });

  await createReleaseToDevPr(release.tag_name, release.body ?? "");
};
