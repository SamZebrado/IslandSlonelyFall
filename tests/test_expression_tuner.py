#!/usr/bin/env python3
"""Tuner selection gating, generated suggestions and persisted choices."""
import unittest
from playwright.sync_api import expect
from browser_harness import BrowserTest


class ExpressionTests(BrowserTest):
    def test_tuner_requires_all_choices(self):
        self.page.set_viewport_size({"width": 375, "height": 667})
        self.prepare_empathy()
        button = self.page.locator('#generateExpressionBtn')
        expect(button).to_be_disabled()
        self.page.locator('[data-audience="self"]').click()
        expect(button).to_be_disabled()
        self.page.locator('[data-mode="journal"]').click()
        expect(button).to_be_disabled()
        self.finish_empathy()
        record = self.state()['empathyRecords'][0]['expressionTuner']
        self.assertEqual((record['audience'], record['mode'], record['tone']), ('self', 'journal', 'gentle'))
        self.assertTrue(record['suggestions'])

    def test_communication_scenarios_generate_suggestions(self):
        for audience, mode, tone in [('partnerFriend', 'faceToFace', 'gentle'),
                                     ('supervisor', 'message', 'clear'),
                                     ('unsafePerson', 'boundary', 'boundary')]:
            with self.subTest(audience=audience):
                self.prepare_empathy()
                self.finish_empathy(audience, mode, tone)
                expect(self.page.locator('#empathyResult .expression-card').first).to_be_visible()
                saved = self.state()['empathyRecords'][-1]['expressionTuner']
                self.assertEqual((saved['audience'], saved['mode'], saved['tone']), (audience, mode, tone))
                self.assertTrue(saved['suggestions'])
                if mode in ('faceToFace', 'message'):
                    self.assertTrue(saved['actionTips'])
                else:
                    self.assertEqual(saved['actionTips'], [])


if __name__ == '__main__':
    unittest.main()
