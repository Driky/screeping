export function creepSay(creep: Creep, message: string): void {
  if (!Memory.sayEnabled) return;

  const filter = Memory.sayRoleFilter;
  if (filter !== undefined) {
    const role = creep.memory.role;
    const allowed = Array.isArray(filter) ? filter.includes(role) : filter === role;
    if (!allowed) return;
  }

  creep.say(message);
}
