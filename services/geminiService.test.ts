// This test file uses Jest-style syntax.

// FIX: Import Jest globals to resolve TypeScript errors about missing test functions.
import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';

// Mock the @google/genai module for all tests
// FIX: Explicitly type the mock function to return a Promise and accept arguments. This resolves the "not assignable to type 'never'" error
// and allows tests to correctly inspect call arguments.
const mockGenerateContent = jest.fn<(...args: any[]) => Promise<any>>();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY',
  },
}));

// Mock constants to isolate the service from other parts of the app
jest.mock('../constants', () => ({
    MVP_GENERATION_STEPS: [
        'Market Analysis',
        'Tech Stack Analysis',
    ]
}));


describe('geminiService', () => {
  // Store and restore process.env to avoid test pollution across different test files
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to force re-evaluation of geminiService.ts with new env variables for each test
    jest.resetModules();
    process.env = { ...originalEnv };
    mockGenerateContent.mockClear();
  });

  afterAll(() => {
    // Restore the original environment
    process.env = originalEnv;
  });

  // --- Test Suite for when API Key is missing (Mock path) ---
  describe('without API_KEY', () => {
    beforeEach(() => {
      delete process.env.API_KEY;
    });

    it('generateFullMvpPlan should use mock implementation', async () => {
      // FIX: Replaced require with dynamic import to resolve TypeScript error.
      const { generateFullMvpPlan } = await import('./geminiService');
      const plan = await generateFullMvpPlan('test idea');
      expect(plan).toHaveProperty('marketAnalysis');
      expect(plan.marketAnalysis.content).toContain('This is a mock response');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('generateProjectCode should use mock implementation', async () => {
      // FIX: Replaced require with dynamic import to resolve TypeScript error.
      const { generateProjectCode } = await import('./geminiService');
      const mockPlan = { ideaPrompt: 'test' } as any;
      const files = await generateProjectCode(mockPlan);
      expect(files.some(f => f.path === '/package.json')).toBe(true);
      expect(JSON.parse(files.find(f => f.path === '/package.json').content).name).toBe('dog-park-finder');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('generateFixInstructions should use mock implementation for a known error', async () => {
      // FIX: Replaced require with dynamic import to resolve TypeScript error.
      const { generateFixInstructions } = await import('./geminiService');
      const error = "Cannot find module 'lucide-react'";
      
      const instructions = await generateFixInstructions([], error);
      
      expect(instructions).toContain("Add the dependency");
      expect(instructions).toContain("package.json");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });

  // --- Test Suite for when API Key is present (Real AI path) ---
  describe('with API_KEY', () => {
    beforeEach(() => {
      process.env.API_KEY = 'test-api-key';
    });

    describe('generateFullMvpPlan', () => {
      it('should call Gemini API and parse a valid response', async () => {
        // FIX: Replaced require with dynamic import to resolve TypeScript error.
        const { generateFullMvpPlan } = await import('./geminiService');
        const mockApiResponse = { text: JSON.stringify({ marketAnalysis: { title: 'Market Analysis', content: 'Success' } }) };
        mockGenerateContent.mockResolvedValue(mockApiResponse);

        const plan = await generateFullMvpPlan('a real idea');
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        expect(plan.marketAnalysis.content).toBe('Success');
      });

      it('should throw "API Quota Exceeded" error', async () => {
        // FIX: Replaced require with dynamic import to resolve TypeScript error.
        const { generateFullMvpPlan } = await import('./geminiService');
        mockGenerateContent.mockRejectedValue(new Error('quota'));
        await expect(generateFullMvpPlan('test')).rejects.toThrow('API Quota Exceeded. Please upgrade your plan or wait for it to reset.');
      });
      
      it('should throw rate limit error', async () => {
        const { generateFullMvpPlan } = await import('./geminiService');
        mockGenerateContent.mockRejectedValue(new Error('429 rate limit'));
        await expect(generateFullMvpPlan('test')).rejects.toThrow(/Rate Limit Exceeded/);
      });

      it('should throw "internal error" on 500 status', async () => {
        // FIX: Replaced require with dynamic import to resolve TypeScript error.
        const { generateFullMvpPlan } = await import('./geminiService');
        mockGenerateContent.mockRejectedValue(new Error('Internal error 500'));
        await expect(generateFullMvpPlan('test')).rejects.toThrow('The AI service encountered an internal error. Please try again later.');
      });
      
      it('should throw "invalid format" on JSON SyntaxError', async () => {
        // FIX: Replaced require with dynamic import to resolve TypeScript error.
        const { generateFullMvpPlan } = await import('./geminiService');
        // The service's try/catch will fail on JSON.parse
        mockGenerateContent.mockResolvedValue({ text: 'this is not valid json' });
        await expect(generateFullMvpPlan('test')).rejects.toThrow('The AI returned an invalid format. Please try again.');
      });
    });

    describe('generateProjectCode', () => {
      const mockPlan = { id: '1', ideaPrompt: 'test' } as any;

      it('should call API and correctly unescape newlines in file content', async () => {
        // FIX: Replaced require with dynamic import to resolve TypeScript error.
        const { generateProjectCode } = await import('./geminiService');
        const apiResponse = { text: JSON.stringify({ files: [{ path: 'test.js', content: 'line1\\nline2' }] }) };
        mockGenerateContent.mockResolvedValue(apiResponse);

        const files = await generateProjectCode(mockPlan);
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        expect(files).toHaveLength(1);
        expect(files[0].content).toBe('line1\nline2');
      });

      it('should throw "API Quota Exceeded" error', async () => {
        // FIX: Replaced require with dynamic import to resolve TypeScript error.
        const { generateProjectCode } = await import('./geminiService');
        mockGenerateContent.mockRejectedValue(new Error('quota'));
        await expect(generateProjectCode(mockPlan)).rejects.toThrow('API Quota Exceeded. You can no longer generate code. Please upgrade your subscription.');
      });

      it('should throw "internal error" on Rpc failed', async () => {
        // FIX: Replaced require with dynamic import to resolve TypeScript error.
        const { generateProjectCode } = await import('./geminiService');
        mockGenerateContent.mockRejectedValue(new Error('Rpc failed'));
        await expect(generateProjectCode(mockPlan)).rejects.toThrow('The AI service encountered an internal error while generating code. Please try again later.');
      });
    });
    
    describe('generateFixInstructions', () => {
        const mockFiles = [{ path: '/index.js', content: 'buggy code' }];
        const mockError = 'SyntaxError';

        it('should call API with error and files in the prompt and return instructions as a string', async () => {
            const { generateFixInstructions } = await import('./geminiService');
            const mockInstructions = "Step 1: Fix this.";
            const apiResponse = { text: JSON.stringify({ instructions: mockInstructions }) };
            mockGenerateContent.mockResolvedValue(apiResponse);

            const result = await generateFixInstructions(mockFiles, mockError);
            
            expect(mockGenerateContent).toHaveBeenCalledTimes(1);
            // FIX: Access the mock call's arguments correctly now that the mock signature is fixed.
            const calledPrompt = mockGenerateContent.mock.calls[0][0].contents;
            expect(calledPrompt).toContain(mockError);
            expect(calledPrompt).toContain(JSON.stringify(mockFiles));
            expect(result).toEqual(mockInstructions);
        });

        it('should throw "internal error" on failure', async () => {
            const { generateFixInstructions } = await import('./geminiService');
            mockGenerateContent.mockRejectedValue(new Error('500'));
            await expect(generateFixInstructions(mockFiles, mockError)).rejects.toThrow('The AI service encountered an internal error while generating the fix.');
        });
    });
  });
});