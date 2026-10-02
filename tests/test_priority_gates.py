#!/usr/bin/env python3
"""Explicit full-mode gate transitions and persisted decision contract."""
import unittest
from playwright.sync_api import expect
from browser_harness import BrowserTest


class PriorityTests(BrowserTest):
    def test_five_gates_save_path_and_next_step(self):
        self.page.set_viewport_size({"width": 375, "height": 667})
        self.open_place('优先级决策岛')
        self.page.locator('[onclick="setPriorityMode(false)"]').click()
        expect(self.page.locator('.gate-node')).to_have_count(5)
        expect(self.page.locator('.gate-node.active')).to_have_attribute('data-gate', 'release')
        self.page.locator('#priorityTask').fill('测试：完成报告')
        self.page.locator('[onclick="startPriorityGates()"] ').click()
        for index, (gate, value, next_gate) in enumerate([
                ('release', 'keep', 'simplify'), ('simplify', 'full', 'delegate'),
                ('delegate', 'alone', 'defer'), ('defer', 'now', 'focus')], 1):
            expect(self.page.locator('.gate-node.active')).to_have_attribute('data-gate', gate)
            self.page.locator('#gateContent [data-value="%s"]' % value).click()
            expect(self.page.locator('.gate-node.active')).to_have_attribute('data-gate', next_gate)
            expect(self.page.locator('.gate-node.completed')).to_have_count(index)
        self.page.locator('#focusNextStep').fill('测试：打开文档写一行')
        self.page.locator('[data-time="2min"]').click()
        self.page.locator('[onclick="finishFocusGate()"] ').click()
        expect(self.page.locator('#priorityResult')).to_be_visible()
        expect(self.page.locator('#pathSummary .path-step')).to_have_count(5)
        records = self.state()['priorityRecords']
        self.assertEqual(len(records), 1)
        record = records[0]
        self.assertEqual(record['task'], '测试：完成报告')
        self.assertEqual(record['decision'], 'TODAY')
        self.assertEqual([x['gateId'] for x in record['gatePath']], ['release', 'simplify', 'delegate', 'defer', 'focus'])
        self.assertEqual(record['result']['minStep'], '测试：打开文档写一行')
        expect(self.page.locator('.result-action-box')).to_contain_text('测试：打开文档写一行')
        self.open_place('回顾花园')
        self.assertEqual(self.state()['priorityRecords'], records)
        expect(self.page.locator('.record-priority')).to_have_count(1)


if __name__ == '__main__':
    unittest.main()
