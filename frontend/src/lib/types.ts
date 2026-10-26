export type Priority = "low" | "medium" | "high" | "urgent";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  tutorialCompletedVersion: number | null;
};

export type Profile = User & { providers: ("google" | "github")[] };

export type Group = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  nodexCount?: number;
};

export type LinkPreview = {
  status: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
};

export type Nodex = {
  id: string;
  type: "note" | "link";
  title: string;
  content: string | null;
  url: string | null;
  priority: Priority | null;
  groupIds: string[];
  createdAt: string;
  updatedAt: string;
  linkPreview: LinkPreview | null;
};

export type NodexMatch = Nodex & { similarity: number };

export type NodexResult = Nodex & { score: number };

export type BoardFilter = { kind: "all" } | { kind: "orphans" } | { kind: "group"; groupId: string };
