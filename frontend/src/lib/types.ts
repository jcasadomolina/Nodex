export type Priority = "low" | "medium" | "high" | "urgent";

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  tutorialCompletedVersion: number | null;
};

export type Profile = User & { hasPassword: boolean; providers: ("google" | "github")[] };

export type Group = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  nodexCount?: number;
};

export type NewGroupProposal = {
  name: string;
  nodexs: { id: string; title: string; type: "note" | "link" }[];
};

export type TaskStatus = "todo" | "doing" | "done";

export type Task = {
  status: TaskStatus;
  dueAt: string | null;
  completedAt: string | null;
};

export type TaskInput = Pick<Task, "status" | "dueAt">;

export type LinkPreview = {
  status: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  archiveUrl: string | null;
  lastCheckedAt: string | null;
};

export type Reminder = {
  remindAt: string;
  sentAt: string | null;
  dismissedAt: string | null;
};

export type Nodex = {
  id: string;
  type: "note" | "link";
  title: string;
  content: string | null;
  url: string | null;
  priority: Priority | null;
  groupIds: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  linkPreview: LinkPreview | null;
  task: Task | null;
  reminder: Reminder | null;
};

export type TaskCard = Task & {
  nodex: Pick<Nodex, "id" | "title" | "type" | "url" | "priority">;
};

export type ReminderItem = Reminder & {
  nodex: Pick<Nodex, "id" | "title" | "type" | "priority">;
};

export type BrokenLink = {
  url: string;
  archiveUrl: string | null;
  nodex: Pick<Nodex, "id" | "title">;
};

export type NodexMatch = Nodex & { similarity: number };

export type NodexResult = Nodex & { score: number };

export type BoardFilter = { kind: "all" } | { kind: "orphans" } | { kind: "group"; groupId: string };

export type Suggestion = {
  id: string;
  kind: "assign_group";
  createdAt: string;
  nodex: { id: string; title: string; type: Nodex["type"] };
  group: { id: string; name: string };
};
