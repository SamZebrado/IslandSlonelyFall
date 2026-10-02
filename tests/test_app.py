#!/usr/bin/env python3
"""Current home, empathy, status and persisted garden workflows."""
import unittest
from playwright.sync_api import expect
from browser_harness import BrowserTest


class AppTests(BrowserTest):
    def test_home_and_navigation(self):
        expect(self.page).to_have_title('慢慢倒 | IslandSlowlyFall')
        expect(self.page.locator('.safety-notice')).to_be_visible()
        for name, selector in [('共情小屋', '#empathySituation'),
                               ('状态观测台', '.status-form'),
                               ('微习惯工坊', '.habits-list'),
                               ('优先级决策岛', '#priorityTask'),
                               ('回顾花园', '.review-page')]:
            with self.subTest(place=name):
                self.open_place(name)
                expect(self.page.locator(selector)).to_be_visible()

    def test_empathy_persists_exact_record_and_renders_after_reload(self):
        self.prepare_empathy()
        self.finish_empathy()
        records = self.state()['empathyRecords']
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]['situation'], '测试：会议后需要休息')
        self.assertEqual(records[0]['request'], '测试：休息两分钟')
        self.assertTrue(records[0]['feelings'])
        self.assertTrue(records[0]['needs'])
        expect(self.page.locator('#empathyResult .expression-card').first).to_contain_text('测试：休息两分钟')
        self.page.reload(wait_until='load')
        self.assertEqual(self.state()['empathyRecords'], records)
        self.open_place('回顾花园')
        expect(self.page.locator('.record-empathy')).to_have_count(1)
        expect(self.page.locator('.record-empathy')).to_contain_text('测试：休息两分钟')
        # A second tab in the same context reads the persisted record.
        other = self.context.new_page()
        other.goto(self.url, wait_until='load')
        self.assertEqual(other.evaluate("JSON.parse(localStorage.getItem('localGuideGameState')).empathyRecords"), records)
        other.close()

    def test_status_values_are_saved(self):
        self.open_place('状态观测台')
        for key, value in [('energy', 3), ('pressure', 2), ('clarity', 4)]:
            self.page.locator('[data-type="%s"][data-value="%s"]' % (key, value)).click()
        self.page.locator('.status-chip').first.click()
        self.page.locator('.direction-chip').first.click()
        self.page.locator('#statusNote').fill('测试状态笔记')
        dialogs = []
        def accept_save_dialog(dialog):
            dialogs.append(dialog.message)
            dialog.accept()
        self.page.once('dialog', accept_save_dialog)
        self.page.locator('[onclick="saveStatus()"] ').click()
        self.assertEqual(len(dialogs), 1)
        record = self.state()['statusRecords'][0]
        self.assertEqual((record['energy'], record['pressure'], record['clarity']), (3, 2, 4))
        self.assertEqual(record['note'], '测试状态笔记')
        self.assertTrue(record['status'])
        self.assertTrue(record['directions'])
        self.open_place('回顾花园')
        expect(self.page.locator('.record-status')).to_have_count(1)
        expect(self.page.locator('.record-status')).to_contain_text('能量 3/10 · 压力 2/10')


if __name__ == '__main__':
    unittest.main()
