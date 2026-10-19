import React from "react";
import {
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  HandThumbUpIcon,
  PuzzlePieceIcon,
  QueueListIcon,
  TrophyIcon,
  UserGroupIcon,
  UserIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";

type SectionIcon = React.ComponentType<{ className?: string }>;

/**
 * Sidebar icons for the options page, keyed by Section.class.
 * Kept out of core/sections so the content script doesn't bundle React/heroicons.
 */
export const sectionIcons: { [sectionClass: string]: SectionIcon } = {
  Awards: TrophyIcon,
  Convo: ChatBubbleLeftRightIcon,
  ForumDisplay: QueueListIcon,
  Games: PuzzlePieceIcon,
  Global: GlobeAltIcon,
  Groups: UserGroupIcon,
  HFX: WrenchIcon,
  Popularity: HandThumbUpIcon,
  PrivateMessages: EnvelopeIcon,
  Profile: UserIcon,
  Threads: DocumentIcon,
};
