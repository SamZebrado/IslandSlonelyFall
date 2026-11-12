#!/usr/bin/env python3
"""Habit creation, completion, skipping, association and reload persistence."""
import unittest
from playwright.sync_api import expect
from browser_harness import BrowserTest


class HabitTests(BrowserTest):
    def test_long_habit_mobile_layout(self):
        self.open_place('微习惯工坊')
        item = self.create_habit('测试：深呼吸，保持淡定，提醒自己给反应留一点时间。' * 3)
        for width in (320, 375, 430, 640):
            with self.subTest(width=width):
                self.page.set_viewport_size({"width": width, "height": 800})
                content = item.locator('.habit-content').bounding_box()
                actions = item.locator('.habit-actions').bounding_box()
                self.assertGreater(content['width'], 150)
                self.assertGreaterEqual(actions['y'], content['y'] + content['height'])
                self.assertLessEqual(actions['x'] + actions['width'], width)
                self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'), width)
        item.get_by_role('button', name='点亮', exact=True).click()
        expect(item.locator('.habit-badge')).to_be_visible()
        self.page.reload()
        self.open_place('微习惯工坊')
        expect(self.page.locator('.habit-item.completed')).to_have_count(1)

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
