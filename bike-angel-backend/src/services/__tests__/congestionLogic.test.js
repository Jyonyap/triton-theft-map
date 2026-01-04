import { CongestionAnalyzer } from '../congestionAnalyzer.js';

describe('CongestionAnalyzer - Pure Logic Tests', () => {
  describe('calculateCongestionLevel', () => {
    it('should return "available" for less than 60% capacity', () => {
      expect(CongestionAnalyzer.calculateCongestionLevel(5, 10)).toBe('available');
      expect(CongestionAnalyzer.calculateCongestionLevel(0, 10)).toBe('available');
      expect(CongestionAnalyzer.calculateCongestionLevel(5, 100)).toBe('available');
      expect(CongestionAnalyzer.calculateCongestionLevel(59, 100)).toBe('available');
    });

    it('should return "filling" for 60-89% capacity', () => {
      expect(CongestionAnalyzer.calculateCongestionLevel(6, 10)).toBe('filling');
      expect(CongestionAnalyzer.calculateCongestionLevel(8, 10)).toBe('filling');
      expect(CongestionAnalyzer.calculateCongestionLevel(60, 100)).toBe('filling');
      expect(CongestionAnalyzer.calculateCongestionLevel(89, 100)).toBe('filling');
    });

    it('should return "full" for 90%+ capacity', () => {
      expect(CongestionAnalyzer.calculateCongestionLevel(9, 10)).toBe('full');
      expect(CongestionAnalyzer.calculateCongestionLevel(10, 10)).toBe('full');
      expect(CongestionAnalyzer.calculateCongestionLevel(90, 100)).toBe('full');
      expect(CongestionAnalyzer.calculateCongestionLevel(100, 100)).toBe('full');
      expect(CongestionAnalyzer.calculateCongestionLevel(150, 100)).toBe('full');
    });

    it('should handle edge cases at boundaries', () => {
      // Exactly 60%
      expect(CongestionAnalyzer.calculateCongestionLevel(60, 100)).toBe('filling');
      // Exactly 90%
      expect(CongestionAnalyzer.calculateCongestionLevel(90, 100)).toBe('full');
      // Just below 60%
      expect(CongestionAnalyzer.calculateCongestionLevel(59, 100)).toBe('available');
      // Just below 90%
      expect(CongestionAnalyzer.calculateCongestionLevel(89, 100)).toBe('filling');
    });

    it('should handle zero capacity edge case', () => {
      // When capacity is 0, any bikes should be "full"
      expect(CongestionAnalyzer.calculateCongestionLevel(1, 0)).toBe('full');
    });

    it('should handle zero bikes', () => {
      expect(CongestionAnalyzer.calculateCongestionLevel(0, 20)).toBe('available');
    });
  });
});
