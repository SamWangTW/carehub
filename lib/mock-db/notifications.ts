import type { Notification } from "../../types/notification";
import { notifications as seed } from "../../mocks/notifications";

let counter = 1;
let store: Notification[] = seed.map((n) => ({ ...n }));

function nextId() {
  const id = `e2e_${Date.now()}_${counter.toString().padStart(4, "0")}`;
  counter += 1;
  return id;
}

export function list(): Notification[] {
  return [...store].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function insert(input: Omit<Notification, "id"> & { id?: string }) {
  const notification: Notification = {
    ...input,
    id: input.id ?? nextId(),
  };
  store = [notification, ...store];
  return notification;
}

export function clearAndSeedForTests() {
  store = seed.map((n) => ({ ...n }));
  counter = 1;
}
