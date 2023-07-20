import { getDraftRelease, publishDraftRelease } from "./github-api/release";
import { mergeReleaseToMain } from "./github-api/branch";
import { createReleaseToDevPr } from "./github-api/pr";

export const publishRelease = async () => {
  const release = await getDraftRelease();

  if (!release) {
    throw new Error(
      "There is no draft release. Are you missing the create step?"
    );
  }

  await publishDraftRelease(release.id);
  await mergeReleaseToMain(release.tag_name);
  // await lockReleaseBranch(release.tag_name); // TODO: this is not supported in a free private repo, so should be tested later
  await createReleaseToDevPr(release.tag_name, release.body ?? "");
};
