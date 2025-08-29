// Minimal in-memory mock API for standalone frontend usage
// NOTE: Replace with real endpoints when you connect a backend

type UUID = string;

const now = () => new Date().toISOString();

// JSON-backed DB (imported at build)
import agentsJson from '#/mocks/db/agents.json';
import conversationsJson from '#/mocks/db/conversations.json';
import domainsJson from '#/mocks/db/domains.json';
import rolesJson from '#/mocks/db/roles.json';
import usersJson from '#/mocks/db/users.json';

const db = {
  agents: (agentsJson as any[]).map((a) => ({ ...a, createdAt: now(), updatedAt: now() })),
  roles: (rolesJson as any[]).map((r) => ({ ...r, createdAt: now(), updatedAt: now() })),
  users: (usersJson as any[]).map((u) => ({ ...u, createdAt: now(), updatedAt: now() })),
  domains: (domainsJson as any[]).map((d) => ({ ...d, createdAt: now(), updatedAt: now() })),
  conversations: (conversationsJson as any[]),
};

// Seed helpers to enrich demo data for visual variety
(() => {
  // More agents
  const agentCount = 6;
  for (let i = 2; i <= agentCount; i++) {
    const uuid = `agent-${i}`;
    db.agents.push({ uuid, name: `Agent ${i}`, insurupAgentId: `AGENT-${1000 + i}`, createdAt: now(), updatedAt: now() });
  }

  // More users
  const firstNames = ['Ada', 'Bora', 'Cem', 'Deniz', 'Efe', 'Funda', 'Gökhan', 'Hale', 'İpek', 'Kerem', 'Lara', 'Mert', 'Naz', 'Okan', 'Pelin', 'Rüzgar', 'Seda', 'Tolga', 'Umut', 'Yasemin'];
  const lastNames = ['Yılmaz', 'Demir', 'Şahin', 'Çelik', 'Kaya', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan'];
  for (let i = 0; i < 40; i++) {
    const id = String(2 + i);
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const agent = db.agents[(i % db.agents.length)];
    db.users.push({ id, firstName: fn, lastName: ln, email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.com`, isActive: i % 7 !== 0, rolesSlugs: i % 5 === 0 ? ['editor'] : ['admin'], createdAt: now(), updatedAt: now(), agent: { uuid: agent.uuid, name: agent.name } });
  }

  // More domains
  const domainCount = 14;
  for (let i = 2; i <= domainCount; i++) {
    const agent = db.agents[i % db.agents.length];
    db.domains.push({ uuid: `d${i}`, domain: `site${i}.demo.dev`, isEnabled: i % 3 !== 0, createdAt: now(), updatedAt: now(), agent: { uuid: agent.uuid, name: agent.name, insurupAgentId: agent.insurupAgentId ?? `AGENT-${1000 + i}` } });
  }

  // More conversations with a few messages
  for (let i = 2; i <= 8; i++) {
    db.conversations.push({
      conversationId: `conv-${i}`,
      title: `Konuşma ${i}`,
      updatedAt: now(),
      messages: [
        { id: `m-${i}-1`, role: 'user', parts: [{ type: 'text', text: 'Merhaba' }] },
        { id: `m-${i}-2`, role: 'assistant', parts: [{ type: 'text', text: 'Size nasıl yardımcı olabilirim?' }] },
      ],
    });
  }
})();

// Agents API
const agents = Object.assign(
  ({ uuid }: { uuid: UUID }) => ({
    get: async () => ({ data: db.agents.find(a => a.uuid === uuid) ?? { uuid, name: 'Demo Agent', insurupAgentId: 'DEMO-AGENT' } }),
    put: async (payload: any) => {
      const idx = db.agents.findIndex(a => a.uuid === uuid);
      if (idx >= 0) db.agents[idx] = { ...db.agents[idx], ...payload, updatedAt: now() };
      return { data: true };
    },
    documents: ({ documentUuid }: { documentUuid?: UUID } = {}) => ({
      get: async () => ({ data: [] as any[] }),
      post: async (_payload: unknown) => ({ data: true }),
      patch: async (_payload: unknown) => ({ data: true }),
      delete: async () => ({ data: true }),
    }),
  }),
  {
    index: {
      get: async () => ({ data: { data: db.agents } }),
      post: async (payload: any) => {
        const uuid = `agent-${Date.now()}`;
        db.agents.push({ uuid, name: payload?.name ?? 'Yeni Agent', insurupAgentId: payload?.insurupAgentId ?? 'AGENT', createdAt: now(), updatedAt: now() });
        return { data: true };
      },
    },
  },
);

// Users API
const users = Object.assign(
  ({ id }: { id: string | number }) => ({
    patch: async (payload: any) => {
      const idx = db.users.findIndex(u => String(u.id) === String(id));
      if (idx >= 0) db.users[idx] = { ...db.users[idx], ...payload, updatedAt: now() };
      return { data: true };
    },
    delete: async () => {
      const before = db.users.length;
      db.users = db.users.filter(u => String(u.id) !== String(id));
      return { data: before !== db.users.length };
    },
    roles: {
      patch: async (_payload: any) => ({ data: true }),
    },
  }),
  {
    get: async () => ({ data: db.users }),
    post: async (payload: any) => {
      const id = String(Date.now());
      db.users.push({ id, createdAt: now(), updatedAt: now(), isActive: true, rolesSlugs: payload?.rolesSlugs ?? [], firstName: payload?.firstName ?? '', lastName: payload?.lastName ?? '', email: payload?.email ?? '' });
      return { data: true };
    },
  },
);

// Roles API
const roles = Object.assign(
  ({ uuid }: { uuid: UUID }) => ({
    patch: async (payload: any) => {
      const idx = db.roles.findIndex(r => r.uuid === uuid);
      if (idx >= 0) db.roles[idx] = { ...db.roles[idx], ...payload, updatedAt: now() };
      return { data: true };
    },
    delete: async () => {
      if (uuid === 'admin') return { data: false };
      const before = db.roles.length;
      db.roles = db.roles.filter(r => r.uuid !== uuid);
      return { data: before !== db.roles.length };
    },
  }),
  {
    get: async () => ({ data: db.roles }),
    post: async (payload: any) => {
      const uuid = `role-${Date.now()}`;
      db.roles.push({ uuid, slug: (payload?.name ?? 'rol').toLowerCase(), name: payload?.name ?? 'Rol', description: payload?.description ?? null, permissions: payload?.permissions ?? [], createdAt: now(), updatedAt: now() });
      return { data: true };
    },
  },
);

// Agent Domains API as Proxy to support bracket access: api["agent-domains"][uuid].delete()
const agentDomains = new Proxy<any>({}, {
  get(_target, prop: string) {
    if (prop === 'index') {
      return { get: async () => ({ data: { data: db.domains } }) };
    }
    // Return domain-specific ops
    return {
      delete: async () => {
        const before = db.domains.length;
        db.domains = db.domains.filter(d => d.uuid !== String(prop));
        return { data: before !== db.domains.length };
      },
    };
  },
});

// Chat API
const chat = {
  auth: {
    status: { get: async () => ({ data: { isAuthenticated: false } }) },
  },
  conversations: {
    get: async (_params?: any) => ({
      data: {
        conversations: db.conversations.map((c: any) => ({ conversationId: c.conversationId, title: c.title, updatedAt: c.updatedAt })),
      },
    }),
  },
  history: {
    get: async (params?: { headers?: Record<string,string> }) => {
      const convId = params?.headers?.['x-conversation-id'] ?? 'conv-1';
      const conv = db.conversations.find((c: any) => c.conversationId === convId) ?? db.conversations[0];
      return { data: { messages: conv?.messages ?? [] } };
    },
  },
  message: {
    stream: {
      post: async (_body: any, _params?: any) => {
        async function* gen() {
          yield `data: ${JSON.stringify({ type: 'text-delta', delta: 'Merhaba! NovaDesk mock aktif. ' })}\n\n`;
          yield `data: ${JSON.stringify({ type: 'tool-output-available', toolCallId: 't1', output: { ok: true } })}\n\n`;
          yield 'data: [DONE]\n\n';
        }
        return { data: gen() } as any;
      },
    },
  },
};

// Auth API
const auth = {
  me: {
    get: async () => ({ data: db.users[0] }),
  },
};

export const api = {
  agents,
  users,
  roles,
  chat,
  auth,
  ['agent-domains']: agentDomains,
};
