import React from "react";
import { UserNotesPanel } from "./UserNotesPanel";

/**
 * Extra options-page UI for features that need more than configurables,
 * keyed by feature id. Shown below the feature's configurables while the
 * feature is enabled.
 */
export const featurePanels: { [featureId: string]: React.FC | undefined } = {
  UserNotes: UserNotesPanel,
};
