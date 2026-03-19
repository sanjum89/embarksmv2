import type { AccountEmployee, OrgNode } from "@/types/account";

export function buildOrgTree(employees: AccountEmployee[]): OrgNode[] {
  const map = new Map<string, OrgNode>();
  const roots: OrgNode[] = [];

  for (const emp of employees) {
    map.set(emp.id, { employee: emp, children: [] });
  }

  for (const emp of employees) {
    const node = map.get(emp.id)!;
    if (emp.reportsTo && map.has(emp.reportsTo)) {
      map.get(emp.reportsTo)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function getDirectReports(userId: string, employees: AccountEmployee[]): AccountEmployee[] {
  return employees.filter((e) => e.reportsTo === userId);
}

export function getTeamMembers(userId: string, employees: AccountEmployee[]): AccountEmployee[] {
  const result: AccountEmployee[] = [];
  const queue = [userId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const reports = employees.filter((e) => e.reportsTo === current);
    for (const r of reports) {
      result.push(r);
      queue.push(r.id);
    }
  }
  return result;
}
