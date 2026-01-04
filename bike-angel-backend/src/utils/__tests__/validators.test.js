import { isUCSDEmail, isStrongPassword, sanitizeInput } from '../validators.js';

describe('Validators', () => {
  describe('isUCSDEmail', () => {
    it('should accept valid UCSD emails', () => {
      expect(isUCSDEmail('student@ucsd.edu')).toBe(true);
      expect(isUCSDEmail('john.doe@ucsd.edu')).toBe(true);
      expect(isUCSDEmail('test123@ucsd.edu')).toBe(true);
    });

    it('should accept UCSD emails with uppercase', () => {
      expect(isUCSDEmail('STUDENT@UCSD.EDU')).toBe(true);
      expect(isUCSDEmail('Student@UCSD.edu')).toBe(true);
    });

    it('should reject non-UCSD emails', () => {
      expect(isUCSDEmail('student@gmail.com')).toBe(false);
      expect(isUCSDEmail('test@ucsd.com')).toBe(false);
      expect(isUCSDEmail('user@ucsdedu')).toBe(false);
      expect(isUCSDEmail('test@ucsd.edu.fake')).toBe(false);
    });

    it('should reject invalid email formats', () => {
      expect(isUCSDEmail('notanemail')).toBe(false);
      expect(isUCSDEmail('')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isUCSDEmail(null)).toBeFalsy();
      expect(isUCSDEmail(undefined)).toBeFalsy();
    });
  });

  describe('isStrongPassword', () => {
    it('should accept strong passwords', () => {
      expect(isStrongPassword('Password1')).toBe(true);
      expect(isStrongPassword('MySecure123')).toBe(true);
      expect(isStrongPassword('Test1234')).toBe(true);
      expect(isStrongPassword('UPPERCASE1lower')).toBe(true);
    });

    it('should reject passwords without uppercase', () => {
      expect(isStrongPassword('password1')).toBe(false);
      expect(isStrongPassword('test1234')).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(isStrongPassword('Password')).toBe(false);
      expect(isStrongPassword('MySecurePass')).toBe(false);
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(isStrongPassword('Pass1')).toBe(false);
      expect(isStrongPassword('Test12')).toBe(false);
      expect(isStrongPassword('Abc123')).toBe(false);
    });

    it('should reject passwords missing multiple requirements', () => {
      expect(isStrongPassword('short')).toBe(false);
      expect(isStrongPassword('12345678')).toBe(false);
      expect(isStrongPassword('abcdefgh')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isStrongPassword(null)).toBeFalsy();
      expect(isStrongPassword(undefined)).toBeFalsy();
      expect(isStrongPassword('')).toBe(false);
    });

    it('should accept passwords with special characters', () => {
      expect(isStrongPassword('Password1!')).toBe(true);
      expect(isStrongPassword('Test@123')).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
      expect(sanitizeInput('\n\ttest\n')).toBe('test');
    });

    it('should remove angle brackets', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello bWorld/b');
    });

    it('should handle normal text', () => {
      expect(sanitizeInput('Normal text')).toBe('Normal text');
      expect(sanitizeInput('Test 123')).toBe('Test 123');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeInput(123)).toBe(123);
      expect(sanitizeInput(null)).toBe(null);
      expect(sanitizeInput(undefined)).toBe(undefined);
    });

    it('should preserve other special characters', () => {
      expect(sanitizeInput('test@email.com')).toBe('test@email.com');
      expect(sanitizeInput('Price: $10.99')).toBe('Price: $10.99');
    });
  });
});
