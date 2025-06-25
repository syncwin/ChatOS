
import { decodeHtmlEntities } from '../lib/utils';

/**
 * Test suite for HTML entity decoding functionality
 * Tests various special characters and encoding scenarios
 */

describe('HTML Entity Decoding', () => {
  test('should decode common HTML entities', () => {
    const input = 'Hello &amp; welcome to &lt;ChatOS&gt; &quot;AI Assistant&quot;!';
    const expected = 'Hello & welcome to <ChatOS> "AI Assistant"!';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test('should decode numeric character references', () => {
    const input = 'Price: &#36;100 &#8211; &#8220;Premium&#8221;';
    const expected = 'Price: $100 – "Premium"';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test('should decode hex character references', () => {
    const input = 'Copyright &#x00A9; 2024 &#x2013; All rights reserved';
    const expected = 'Copyright © 2024 – All rights reserved';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test('should handle Unicode escape sequences', () => {
    const input = 'Unicode test: \\u0041\\u0042\\u0043';
    const expected = 'Unicode test: ABC';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test('should normalize line endings', () => {
    const input = 'Line 1\r\nLine 2\rLine 3\nLine 4';
    const expected = 'Line 1\nLine 2\nLine 3\nLine 4';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test('should handle special spaces', () => {
    const input = 'Word&nbsp;with&nbsp;non-breaking\u00A0spaces';
    const expected = 'Word with non-breaking spaces';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test('should handle complex mixed content', () => {
    const input = `
      &lt;div&gt;
        &quot;Hello &amp; welcome!&quot;
        Price: &#36;99.99
        Copyright &#x00A9; 2024
        Line\r\nBreak
      &lt;/div&gt;
    `;
    const expected = `
      <div>
        "Hello & welcome!"
        Price: $99.99
        Copyright © 2024
        Line\nBreak
      </div>
    `;
    expect(decodeHtmlEntities(input)).toBe(expected);
  });

  test('should handle empty and null inputs', () => {
    expect(decodeHtmlEntities('')).toBe('');
    expect(decodeHtmlEntities(null as unknown as string)).toBe(null);
    expect(decodeHtmlEntities(undefined as unknown as string)).toBe(undefined);
  });

  test('should handle text without entities', () => {
    const input = 'Plain text without any special characters';
    expect(decodeHtmlEntities(input)).toBe(input);
  });

  test('should handle markdown formatting', () => {
    const input = '**Bold** &amp; *italic* text with &lt;code&gt;snippets&lt;/code&gt;';
    const expected = '**Bold** & *italic* text with <code>snippets</code>';
    expect(decodeHtmlEntities(input)).toBe(expected);
  });
});

/**
 * Manual test cases for visual verification
 * These can be used to manually test the functionality in the browser console
 */
export const manualTestCases = {
  commonEntities: {
    input: 'Test &amp; verify &lt;special&gt; &quot;characters&quot; &#39;work&#39;',
    description: 'Common HTML entities: &, <, >, ", \''
  },
  numericRefs: {
    input: 'Symbols: &#8364; &#8482; &#174; &#169;',
    description: 'Numeric character references: €, ™, ®, ©'
  },
  hexRefs: {
    input: 'Hex refs: &#x20AC; &#x2122; &#xAE; &#xA9;',
    description: 'Hex character references: €, ™, ®, ©'
  },
  unicodeEscapes: {
    input: 'Unicode: \\u2764\\uFE0F \\u1F44D \\u1F680',
    description: 'Unicode escape sequences: ❤️, 👍, 🚀'
  },
  mixedContent: {
    input: 'Mixed: &quot;Hello&quot; &#x2013; \\u2764\\uFE0F &amp; more!',
    description: 'Mixed encoding types in one string'
  }
};
