import jwt from 'jsonwebtoken';

describe('JWT Token Logic', () => {
  const TEST_SECRET = 'test-secret-key-for-testing';
  
  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  describe('Token Generation', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId }, TEST_SECRET, { expiresIn: '7d' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include userId in token payload', () => {
      const userId = 'user-456';
      const token = jwt.sign({ userId }, TEST_SECRET);
      const decoded = jwt.decode(token);
      
      expect(decoded.userId).toBe(userId);
    });

    it('should include expiration in token', () => {
      const userId = 'user-789';
      const token = jwt.sign({ userId }, TEST_SECRET, { expiresIn: '7d' });
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token', () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId }, TEST_SECRET);
      
      const decoded = jwt.verify(token, TEST_SECRET);
      
      expect(decoded.userId).toBe(userId);
    });

    it('should reject token with wrong secret', () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId }, TEST_SECRET);
      
      expect(() => {
        jwt.verify(token, 'wrong-secret');
      }).toThrow();
    });

    it('should reject expired token', () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId }, TEST_SECRET, { expiresIn: '0s' });
      
      // Wait a moment to ensure expiration
      return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
        expect(() => {
          jwt.verify(token, TEST_SECRET);
        }).toThrow('jwt expired');
      });
    });

    it('should reject malformed token', () => {
      expect(() => {
        jwt.verify('not-a-valid-token', TEST_SECRET);
      }).toThrow();
    });
  });

  describe('Token Decoding', () => {
    it('should decode token without verification', () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId }, TEST_SECRET);
      
      const decoded = jwt.decode(token);
      
      expect(decoded.userId).toBe(userId);
    });

    it('should return null for invalid token', () => {
      const decoded = jwt.decode('invalid-token');
      
      expect(decoded).toBeNull();
    });
  });
});
