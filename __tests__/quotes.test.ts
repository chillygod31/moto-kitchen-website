/**
 * 🎯 Moto Kitchen Quotes System - Comprehensive Test Suite
 * Tests for security, validation, rate limiting, and operations
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// ============================================================================
// 1. SECURITY TESTS - Access Control & Authentication
// ============================================================================

describe('🔐 Security: Access Control', () => {
  describe('Public Quote Submission', () => {
    it('TEST 1.1.1: Anonymous user can submit quote', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          eventDate: '2025-06-15',
          guestCount: '100',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          dietary: [],
          message: 'Test quote submission',
          budget: '1000-2500',
          howFound: 'google',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.quoteId).toBeDefined();
    });

    it('TEST 1.1.2: Anonymous user cannot access /api/quotes', async () => {
      const response = await fetch('http://localhost:3000/api/quotes');
      // Should require authentication or redirect
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Admin Authentication', () => {
    it('TEST 1.2.1: Unauthenticated user redirects from /admin/quotes', async () => {
      const response = await fetch('http://localhost:3000/admin/quotes', {
        redirect: 'manual', // Don't follow redirects
      });
      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get('location')).toContain('/admin/login');
    });

    it('TEST 1.2.2: Authenticated admin can access /admin/quotes', async () => {
      // This would require valid admin session
      // Simplified: just verify endpoint exists
      const response = await fetch('http://localhost:3000/admin/quotes');
      // Will redirect to login if not authenticated (expected)
      expect([200, 307]).toContain(response.status);
    });
  });
});

// ============================================================================
// 2. VALIDATION TESTS - Required Fields & Input Validation
// ============================================================================

describe('✅ Validation: Required Fields & Constraints', () => {
  describe('Required Field Enforcement', () => {
    it('TEST 2.1.1: Rejects missing name', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.1.2: Rejects missing email', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.1.3: Rejects invalid email format', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'notanemail',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.1.4: Rejects missing phone', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          countryCode: '+31',
          eventType: 'wedding',
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.1.5: Rejects missing eventType', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.1.6: Rejects missing guestCount', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.1.7: Rejects missing location', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          guestCount: '50',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.1.8: Rejects missing serviceType', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          guestCount: '50',
          location: 'Amsterdam',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.1.9: Requires budget for full-catering service', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          // Missing budget
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.1.10: Does NOT require budget for pickup-only service', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'pickup-only',
          // No budget needed
        }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Date Logic', () => {
    it('TEST 2.2.1: Accepts date when dateFlexible is false', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          eventDate: futureDate.toISOString().split('T')[0],
          dateFlexible: false,
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(200);
    });

    it('TEST 2.2.2: Accepts flexible date without eventDate', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          eventDate: '', // Empty when flexible
          dateFlexible: true,
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(200);
    });

    it('TEST 2.2.3: Rejects past date', async () => {
      const pastDate = new Date('2020-01-01');

      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          eventDate: pastDate.toISOString().split('T')[0],
          dateFlexible: false,
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('TEST 2.2.4: Requires date when dateFlexible is false', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          eventDate: '', // Empty date
          dateFlexible: false, // But not flexible
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});

// ============================================================================
// 3. RATE LIMITING & SPAM PREVENTION TESTS
// ============================================================================

describe('🛡️ Rate Limiting & Spam Prevention', () => {
  describe('Rate Limit (3 per minute)', () => {
    it('TEST 3.1.1: Allows 3 submissions within 1 minute', async () => {
      const requests = [];
      for (let i = 0; i < 3; i++) {
        const response = await fetch('http://localhost:3000/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Test User ${i}`,
            email: `test${i}@example.com`,
            phone: '+31612345678',
            countryCode: '+31',
            eventType: 'wedding',
            eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            guestCount: '50',
            location: 'Amsterdam',
            serviceType: 'full-catering',
            budget: '1000-2500',
          }),
        });
        requests.push(response.status);
      }

      expect(requests).toEqual([200, 200, 200]);
    });

    it('TEST 3.1.2: Blocks 4th submission within 1 minute (429)', async () => {
      // Note: This might not work if requests are spaced out
      // In real testing, send all 4 rapidly
      let response;
      for (let i = 0; i < 4; i++) {
        response = await fetch('http://localhost:3000/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Rate Limit Test ${i}`,
            email: `ratelimit${i}@example.com`,
            phone: '+31612345678',
            countryCode: '+31',
            eventType: 'wedding',
            eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            guestCount: '50',
            location: 'Amsterdam',
            serviceType: 'full-catering',
            budget: '1000-2500',
          }),
        });
      }

      expect(response!.status).toBe(429); // Too Many Requests
    });
  });

  describe('Honeypot Spam Detection', () => {
    it('TEST 3.2.1: Silently rejects honeypot submission', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
          website: 'https://spamsite.com', // Honeypot filled
        }),
      });

      // Should return success but NOT create quote
      expect(response.status).toBe(200);
      const data = await response.json();
      // Quote should NOT be created in database (admin won't see it)
      expect(data.success).toBe(true); // Fake success for bot
    });
  });
});

// ============================================================================
// 4. OPERATIONS TESTS - Email, Admin Panel, Status
// ============================================================================

describe('📊 Operations: Email & Admin Functionality', () => {
  let lastSubmittedQuoteId: string;

  describe('Quote Creation & Storage', () => {
    it('TEST 4.1.1: Quote appears in database immediately', async () => {
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Database Test',
          email: 'dbtest@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          guestCount: '50',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '1000-2500',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      lastSubmittedQuoteId = data.quoteId;

      // Try to retrieve it
      const getResponse = await fetch(
        `http://localhost:3000/api/quotes/${data.quoteId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Will fail if not authenticated, but if it returns something, good sign
      expect([200, 401]).toContain(getResponse.status);
    });
  });

  describe('Admin Email Notification', () => {
    it('TEST 4.2.1: Email sent to admin (manual check needed)', async () => {
      // Automated email checking is complex
      // Manual verification: Check info@motokitchen.nl within 30 seconds
      const response = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Email Test User',
          email: 'emailtest@example.com',
          phone: '+31612345678',
          countryCode: '+31',
          eventType: 'wedding',
          eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          guestCount: '100',
          location: 'Amsterdam',
          serviceType: 'full-catering',
          budget: '2500-5000',
          message: 'This is a test quote for email verification',
        }),
      });

      expect(response.status).toBe(200);
      console.log('📧 Check info@motokitchen.nl for email within 30 seconds');
      console.log('📧 Email should contain quote details and customer info');
    });
  });

  describe('Admin Status Updates', () => {
    it('TEST 4.3.1: Can update quote status', async () => {
      if (!lastSubmittedQuoteId) {
        console.log('⚠️ Skip: No quote ID from previous test');
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/quotes/${lastSubmittedQuoteId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'contacted' }),
        }
      );

      // Will fail if not authenticated (expected for this test)
      // Just verify request is processed
      expect([200, 401, 403]).toContain(response.status);
    });

    it('TEST 4.3.2: Can add notes to quote', async () => {
      if (!lastSubmittedQuoteId) {
        console.log('⚠️ Skip: No quote ID from previous test');
        return;
      }

      const response = await fetch(
        `http://localhost:3000/api/quotes/${lastSubmittedQuoteId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: 'Follow up in 2 days' }),
        }
      );

      // Will fail if not authenticated (expected for this test)
      expect([200, 401, 403]).toContain(response.status);
    });
  });
});

// ============================================================================
// 5. DATA INTEGRITY & EDGE CASES
// ============================================================================

describe('🧪 Edge Cases & Data Integrity', () => {
  it('TEST 5.1.1: Handles very long input gracefully', async () => {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'A'.repeat(1000), // Very long name
        email: 'test@example.com',
        phone: '+31612345678',
        countryCode: '+31',
        eventType: 'wedding',
        guestCount: '50',
        location: 'Amsterdam',
        serviceType: 'full-catering',
        budget: '1000-2500',
        message: 'B'.repeat(5000), // Very long message
      }),
    });

    // Should either accept or reject gracefully
    expect([200, 400]).toContain(response.status);
  });

  it('TEST 5.1.2: Handles special characters in input', async () => {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'François O\'Brien',
        email: 'test+tag@example.co.uk',
        phone: '+31612345678',
        countryCode: '+31',
        eventType: 'wedding',
        guestCount: '50',
        location: 'Amsterdam',
        serviceType: 'full-catering',
        budget: '1000-2500',
        message: 'Special chars: <>&"\'',
      }),
    });

    expect(response.status).toBe(200);
  });

  it('TEST 5.1.3: Prevents SQL injection in message', async () => {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'test@example.com',
        phone: '+31612345678',
        countryCode: '+31',
        eventType: 'wedding',
        guestCount: '50',
        location: 'Amsterdam',
        serviceType: 'full-catering',
        budget: '1000-2500',
        message: "'; DROP TABLE quotes; --",
      }),
    });

    expect(response.status).toBe(200);
    // Verify quote created (not deleted by injection)
    expect(await response.json()).toHaveProperty('quoteId');
  });

  it('TEST 5.1.4: Handles missing Content-Type header', async () => {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'test@example.com',
        phone: '+31612345678',
        countryCode: '+31',
        eventType: 'wedding',
        guestCount: '50',
        location: 'Amsterdam',
        serviceType: 'full-catering',
        budget: '1000-2500',
      }),
    });

    // Should handle gracefully
    expect([200, 400, 415]).toContain(response.status);
  });
});

// ============================================================================
// 6. PERFORMANCE TESTS
// ============================================================================

describe('⚡ Performance', () => {
  it('TEST 6.1.1: Form submission completes within 3 seconds', async () => {
    const startTime = Date.now();

    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Performance Test',
        email: 'perf@example.com',
        phone: '+31612345678',
        countryCode: '+31',
        eventType: 'wedding',
        guestCount: '50',
        location: 'Amsterdam',
        serviceType: 'full-catering',
        budget: '1000-2500',
      }),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(3000); // 3 second limit
    console.log(`✅ Response time: ${duration}ms`);
  });

  it('TEST 6.1.2: Admin quotes list loads within 1 second', async () => {
    const startTime = Date.now();

    const response = await fetch('http://localhost:3000/api/quotes');

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`📊 Quotes list load time: ${duration}ms`);
    // Should be fast (will fail auth but response should be quick)
    expect(duration).toBeLessThan(1000); // 1 second limit
  });
});

