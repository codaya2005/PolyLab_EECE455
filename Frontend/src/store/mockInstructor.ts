import { nanoid } from "nanoid";

export type Classroom = {
  id: string;
  name: string;
  code?: string;        // course code
  joinCode: string;
  createdAt: number;
  membersCount: number;
};

export type Member = {
  id: string;
  name?: string;
  email: string;
  role: "Student" | "TA" | "Instructor";
  joinedAt: number;
  status: "Active" | "Pending" | "Removed";
};

function makeJoinCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

const initial: Classroom[] = [
  { id: "c1", name: "Cryptography 101", code: "CRYPTO101", joinCode: "ABCD1F", createdAt: Date.now() - 86400e3*10, membersCount: 27 },
  { id: "c2", name: "Network Security", code: "NET-SEC", joinCode: "JKL9QP", createdAt: Date.now() - 86400e3*30, membersCount: 22 },
  { id: "c3", name: "Applied Algebra", code: "ALG-220", joinCode: "PRSTUV", createdAt: Date.now() - 86400e3*60, membersCount: 18 },
];

const membersByClass: Record<string, Member[]> = {
  c1: [
    { id: "m1", name: "Alice Smith", email: "alice@example.com", role: "Student", joinedAt: Date.now()-86400e3*20, status:"Active" },
    { id: "m2", name: "Bob Lee", email: "bob@example.com", role: "TA", joinedAt: Date.now()-86400e3*18, status:"Active" },
    { id: "m3", email: "pending@example.com", role: "Student", joinedAt: Date.now(), status:"Pending" },
  ],
  c2: [],
  c3: [],
};

export const mockStore = {
  classrooms: [...initial],

  listClassrooms(): Classroom[] {
    return [...this.classrooms].sort((a,b)=>b.createdAt - a.createdAt);
  },

  createClassroom(payload: { name: string; code?: string; section?: string; term?: string; description?: string; joinModel: "code" | "invite" }) {
    const c: Classroom = {
      id: nanoid(),
      name: payload.name,
      code: payload.code,
      joinCode: makeJoinCode(),
      createdAt: Date.now(),
      membersCount: 0,
    };
    this.classrooms.unshift(c);
    membersByClass[c.id] = [];
    return c;
  },

  getClassroom(id: string) {
    return this.classrooms.find(c=>c.id===id) || null;
  },

  regenerateJoinCode(id: string) {
    const c = this.getClassroom(id);
    if(!c) return null;
    c.joinCode = makeJoinCode();
    return c.joinCode;
  },

  listMembers(classId: string): Member[] {
    return [...(membersByClass[classId] || [])];
  },

  inviteMember(classId: string, email: string) {
    const arr = membersByClass[classId] || (membersByClass[classId]=[]);
    arr.push({ id: nanoid(), email, role: "Student", joinedAt: Date.now(), status: "Pending" });
  },

  promoteToTA(classId: string, memberId: string) {
    const m = (membersByClass[classId]||[]).find(x=>x.id===memberId);
    if (m) m.role = "TA";
  },

  removeMember(classId: string, memberId: string) {
    const arr = membersByClass[classId]||[];
    const idx = arr.findIndex(x=>x.id===memberId);
    if (idx>=0) arr.splice(idx,1);
  }
};
