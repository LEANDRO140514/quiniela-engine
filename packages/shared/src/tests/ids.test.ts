import { describe, it, expect } from 'vitest';
import {
  isValidId,
  getPrefix,
  matchesPrefix,
  assertId,
  VALID_PREFIXES,
} from '../ids/EntityId';

describe('EntityId', () => {
  it('debe validar ID con prefijo válido', () => {
    expect(isValidId('cnt_01JX2K5N8P3Q7R0A1B4C6D9F')).toBe(true);
    expect(isValidId('usr_01ABCDEF')).toBe(true);
    expect(isValidId('conv_01JX2K5N')).toBe(true);
    expect(isValidId('wfl_01JX')).toBe(true);
    expect(isValidId('evt_abc123')).toBe(true);
    expect(isValidId('tnt_tenant1')).toBe(true);
  });

  it('debe rechazar ID sin prefijo', () => {
    expect(isValidId('01JX2K5N8P3Q')).toBe(false);
  });

  it('debe rechazar ID con prefijo inválido', () => {
    expect(isValidId('xyz_01JX2K5N')).toBe(false);
    expect(isValidId('invalid_123')).toBe(false);
  });

  it('debe rechazar string vacío', () => {
    expect(isValidId('')).toBe(false);
  });

  it('debe extraer prefijo correctamente', () => {
    expect(getPrefix('cnt_01JX2K5N')).toBe('cnt');
    expect(getPrefix('opp_abc')).toBe('opp');
    expect(getPrefix('invalid')).toBeUndefined();
  });

  it('matchesPrefix debe verificar prefijo exacto', () => {
    expect(matchesPrefix('cnt_abc123', 'cnt')).toBe(true);
    expect(matchesPrefix('cnt_abc123', 'usr')).toBe(false);
    expect(matchesPrefix('usr_abc123', 'usr')).toBe(true);
  });

  it('assertId debe lanzar con ID inválido', () => {
    expect(() => assertId('bad-id', 'cnt')).toThrow('Invalid ID');
  });

  it('assertId debe lanzar con prefijo incorrecto', () => {
    expect(() => assertId('usr_abc123', 'cnt')).toThrow('Invalid ID');
  });

  it('assertId no debe lanzar con ID válido', () => {
    expect(() => assertId('cnt_abc123', 'cnt')).not.toThrow();
  });

  it('todos los prefijos registrados deben ser 3 o 4 caractéres', () => {
    VALID_PREFIXES.forEach((p) => {
      expect(p.length).toBeGreaterThanOrEqual(3);
      expect(p.length).toBeLessThanOrEqual(4);
    });
  });
});
