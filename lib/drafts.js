export const createDraft = () => {
  const id = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const draft = {
    _id: id,
    title: "Untitled Form",
    description: "",
    questions: [],
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(`draft-${id}`, JSON.stringify(draft));

  return draft;
};

export const getDraft = (id) => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`draft-${id}`);
  return raw ? JSON.parse(raw) : null;
};

export const saveDraft = (draft) => {
  if (typeof window === "undefined" || !draft?._id) return;
  localStorage.setItem(`draft-${draft._id}`, JSON.stringify(draft));
};

export const listDrafts = () => {
  if (typeof window === "undefined") return [];

  const drafts = [];

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("draft-")) {
      const raw = localStorage.getItem(key);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        if (parsed?._id) drafts.push(parsed);
      } catch {
        localStorage.removeItem(key);
      }
    }
  });

  return drafts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
};

export const deleteDraft = (id) => {
  if (typeof window === "undefined" || !id) return;
  localStorage.removeItem(`draft-${id}`);
};
