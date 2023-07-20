import * as github from "@actions/github";
import { getDraftRelease, updateDraftRelease } from "./github-api/release";
import {
  extractBranchFromRef,
  extractReleaseVersionFromRef,
} from "./utils/ref";

export const updateRelease = async () => {
  const version = extractReleaseVersionFromRef(github.context.ref);
  const branch = extractBranchFromRef(github.context.ref);

  const release = await getDraftRelease();

  if (!release) {
    throw new Error(
      "There is no draft release. Are you missing the create step?"
    );
  }

  await updateDraftRelease(release.id, version, branch);
};
