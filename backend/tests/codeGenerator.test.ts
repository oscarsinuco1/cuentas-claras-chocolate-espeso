import { describe, it, expect } from 'vitest';
import { generatePlanCode, isValidPlanCode } from '../src/utils/codeGenerator.js';

describe('Code Generator', () => {
  describe('generatePlanCode', () => {
    it('should generate a code in format XXXX-XXXX', () => {
      const code = generatePlanCode();
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generatePlanCode());
      }
      expect(codes.size).toBe(100);
    });

    it('should not include ambiguous characters (0, O, I, l, 1)', () => {
      for (let i = 0; i < 50; i++) {
        const code = generatePlanCode();
        expect(code).not.toMatch(/[0OIl1]/);
      }
    });
  });

  describe('isValidPlanCode', () => {
    it('should validate correct codes', () => {
      expect(isValidPlanCode('ABCD-1234')).toBe(false); // 1 is not valid
      expect(isValidPlanCode('ABCD-2345')).toBe(true);
      expect(isValidPlanCode('WXYZ-6789')).toBe(true);
    });

    it('should reject invalid codes', () => {
      expect(isValidPlanCode('')).toBe(false);
      expect(isValidPlanCode('ABCD1234')).toBe(false); // Missing hyphen
      expect(isValidPlanCode('ABC-1234')).toBe(false); // Too short
      expect(isValidPlanCode('ABCDE-1234')).toBe(false); // Too long
      expect(isValidPlanCode('abcd-1234')).toBe(false); // Lowercase
      expect(isValidPlanCode('ABCD-123O')).toBe(false); // Contains O
    });
  });
});
