#!/usr/bin/env python3
"""Habit creation, completion, skipping, association and reload persistence."""
import unittest
from playwright.sync_api import expect
from browser_harness import BrowserTest


class HabitTests(BrowserTest):
    def test_completion_and_skip_persist_with_correct_habit(self):
        self.page.set_viewport_size({"width": 375, "height": 667})
        self.open_place('微习惯工坊')
        item = self.create_habit()
        expect(item.locator('.habit-icon')).to_have_text('🌱')
        item.get_by_role('button', name='点亮', exact=True).click()
        expect(item.locator('.habit-badge')).to_be_visible()
        expect(item.locator('.habit-icon')).to_have_text('🌿')
        second = self.create_habit('测试：深呼吸')
        second.get_by_role('button', name='跳过', exact=True).click()
        expect(second.locator('.habit-badge.skipped')).to_be_visible()
        state = self.state()
        self.assertEqual(len(state['habits']), 2)
        self.assertEqual([(x['habitId'], x['status']) for x in state['habitLogs']],
                         [(state['habits'][0]['id'], 'completed'), (state['habits'][1]['id'], 'skipped')])
        self.open_place('微习惯工坊')
        self.assertEqual(self.state()['habitLogs'], state['habitLogs'])
        expect(self.page.locator('.habit-item.completed')).to_have_count(1)
        expect(self.page.locator('.habit-item.skipped')).to_have_count(1)
        expect(self.page.locator('.habits-gentle-stats')).to_contain_text('已点亮')
        self.open_place('回顾花园')
        expect(self.page.locator('.record-habit')).to_have_count(2)


if __name__ == '__main__':
    unittest.main()
