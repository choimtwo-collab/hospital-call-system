import { AppUser } from '../types';

/**
 * 브라우저 Web Crypto API를 사용한 SHA-256 해시 함수
 */
export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  if (window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash for non-crypto environments
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash |= 0;
  }
  return 'simple_' + Math.abs(hash).toString(16);
}

/**
 * 비밀번호 검증 함수
 */
export async function verifyPassword(password: string, expectedHash: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === expectedHash;
}

/**
 * 초기 최고 관리자 (Super Admin) 기본 계정
 * 아이디: admin / 초기 비밀번호: admin1234
 */
export const initialSuperAdminUser: AppUser = {
  id: 'user_super_admin',
  username: 'admin',
  name: '시스템 최고 관리자',
  department: '수련교육팀 / 간호부',
  position: '마스터 관리자',
  passwordHash: 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', // admin1234
  role: 'SUPER_ADMIN',
  status: 'APPROVED',
  permissions: [
    'schedules',
    'sheets',
    'tasks',
    'rules',
    'contacts',
    'common_nurse',
    'hotlines',
    'data',
    'users'
  ],
  createdAt: '2026-09-01T00:00:00.000Z'
};

export const initialUsers: AppUser[] = [initialSuperAdminUser];
