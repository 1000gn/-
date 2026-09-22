import { normalizeEnvironment, toCanonicalUserRole, type CanonicalUserRole, type EnvironmentType } from '../types';

export const OWNER_EMAIL = '1000gn521@gmail.com';

export interface ProjectContext {
  projectId: string;
  environment: EnvironmentType;
  callerId: string;
  callerEmail: string;
  callerRole: string; // 'OWNER' | 'MEMBER' | 'GUEST' (+호환용 ADMIN 등)
  isAuthenticated: boolean;
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export function normalizeCallerRole(role?: string): string {
  const r = String(role ?? 'GUEST').trim().toUpperCase();
  if (r === 'OWNER' || r === 'ADMIN') return r;
  if (r === 'EXECUTIVE' || r === 'ADVISOR' || r === 'MEMBER' || r === 'VIEWER') return r;
  return 'GUEST';
}

// server.ts 미들웨어와 동일 규칙: 토큰 우선, 무토큰 OWNER/ADMIN 자칭은 MEMBER로 강등
export function resolveCallerRole(opts: { tokenEmail?: string; tokenVerified?: boolean; clientAssertedRole?: string }): string {
  const { tokenEmail, tokenVerified, clientAssertedRole } = opts;
  if (tokenEmail) {
    if (tokenEmail === OWNER_EMAIL && tokenVerified) return 'OWNER';
    return 'MEMBER';
  }
  const asserted = String(clientAssertedRole ?? 'MEMBER').toUpperCase();
  if (asserted === 'OWNER' || asserted === 'ADMIN') return 'MEMBER';
  return normalizeCallerRole(asserted);
}

export function getCanonicalRole(ctx: Pick<ProjectContext, 'callerRole'>): CanonicalUserRole {
  return toCanonicalUserRole(ctx.callerRole);
}

export function isOwner(ctx: Pick<ProjectContext, 'callerRole' | 'callerEmail'>): boolean {
  return String(ctx.callerRole).toUpperCase() === 'OWNER' || String(ctx.callerRole).toUpperCase() === 'ADMIN';
}

export function isAuthenticated(ctx: Pick<ProjectContext, 'isAuthenticated' | 'callerRole'>): boolean {
  return !!ctx.isAuthenticated && String(ctx.callerRole).toUpperCase() !== 'GUEST';
}

export function canRead(ctx: ProjectContext): boolean {
  return true; // 조회는 게스트 허용 (민감 컬렉션은 Firestore rules로 차단)
}

export function canWrite(ctx: ProjectContext): boolean {
  return isAuthenticated(ctx);
}

// AI제안 확정(Draft→Confirmed) 및 의사결정 승인: TEST는 인증자, REAL은 OWNER만
export function canAdopt(ctx: ProjectContext): boolean {
  if (!isAuthenticated(ctx)) return false;
  if (normalizeEnvironment(ctx.environment) === 'REAL') {
    return isOwner(ctx);
  }
  return true;
}

// REAL 초기화는 OWNER만, TEST 초기화는 인증자
export function canReset(ctx: ProjectContext): boolean {
  if (!isAuthenticated(ctx)) return false;
  if (normalizeEnvironment(ctx.environment) === 'REAL') return isOwner(ctx);
  return true;
}

export function canApproveDecision(ctx: ProjectContext): boolean {
  return canAdopt(ctx);
}

export function requireCanWrite(ctx: ProjectContext): void {
  if (!canWrite(ctx)) throw new HttpError(401, 'UNAUTHENTICATED', '로그인이 필요합니다.');
}

export function requireCanAdopt(ctx: ProjectContext): void {
  if (!canAdopt(ctx)) throw new HttpError(403, 'FORBIDDEN', '확정 권한이 없습니다. TEST에서 검토하거나 본부장 승인을 받으세요.');
}

export function requireCanReset(ctx: ProjectContext): void {
  if (!canReset(ctx)) throw new HttpError(403, 'FORBIDDEN', '운영(REAL) 환경에서는 본부장(OWNER)만 초기화할 수 있습니다.');
}

// --- 클라이언트 표시용 ---
export function canShowAdminUI(role?: string): boolean {
  const r = toCanonicalUserRole(role);
  return r === 'OWNER' || r === 'ADMIN';
}

export function readProjectContext(req: any): ProjectContext {
  const c = req?.projectContext ?? {};
  return {
    projectId: String(c.projectId || 'proj-gunsan-pmi'),
    environment: normalizeEnvironment(c.environment),
    callerId: String(c.callerId || 'guest'),
    callerEmail: String(c.callerEmail || ''),
    callerRole: normalizeCallerRole(c.callerRole),
    isAuthenticated: !!c.isAuthenticated,
  };
}
