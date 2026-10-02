#!/usr/bin/env python3
"""Real JSON upload/download protection and viewport checks, not device validation."""
import json
from pathlib import Path
import unittest
from playwright.sync_api import expect
from browser_harness import BrowserTest


class HardenTests(BrowserTest):
    def test_viewport_navigation(self):
        for width, height in [(390, 844), (360, 740), (768, 1024)]:
            with self.subTest(width=width):
                self.page.set_viewport_size({'width': width, 'height': height})
                self.open_place('共情小屋')
                expect(self.page.locator('#empathySituation')).to_be_visible()
                self.page.locator('#empathySituation').fill('测试窄屏输入')
                expect(self.page.locator('#empathySituation')).to_have_value('测试窄屏输入')

    def test_invalid_import_preserves_existing_record(self):
        self.open_place('回顾花园')
        # Import a stable record through the UI. Normalization adds missing ids
        # by design, so the fixture declares its id before checking rollback.
        fixture = {'meta': {'createdAt': '2026-10-02T12:00:00Z',
                            'updatedAt': '2026-10-02T12:00:00Z'},
                   'empathyRecords': [{'id': 'import-test-1',
                   'timestamp': '2026-10-02T12:00:00Z',
                   'situation': 'existing user record', 'feelings': ['平静'],
                   'selfExpression': 'keep this record'}]}
        with self.page.expect_event('dialog') as event:
            self.page.locator('#importFile').set_input_files({
                'name': 'existing.json', 'mimeType': 'application/json',
                'buffer': json.dumps(fixture).encode()})
        self.assertIn('导入成功', event.value.message)
        event.value.accept()
        expect(self.page.locator('.record-empathy')).to_have_count(1)
        before = self.state()
        for content in ['', 'not JSON', '["array"]', 'null']:
            with self.subTest(content=content):
                with self.page.expect_event('dialog') as event:
                    self.page.locator('#importFile').set_input_files({
                        'name': 'invalid.json', 'mimeType': 'application/json', 'buffer': content.encode()})
                self.assertIn('导入失败', event.value.message)
                event.value.accept()
                self.assertEqual(self.state(), before)
                expect(self.page.locator('.record-empathy')).to_have_count(1)

    def test_export_import_round_trip(self):
        self.prepare_empathy()
        self.finish_empathy()
        self.open_place('回顾花园')
        records = self.state()['empathyRecords']
        with self.page.expect_download() as event:
            self.page.locator('[onclick="exportAllData()"] ').click()
        content = Path(event.value.path()).read_bytes()
        exported_records = json.loads(content)['empathyRecords']
        # Export normalizes missing record ids; all recorded user fields must match.
        self.assertEqual([{k: v for k, v in record.items() if k != 'id'}
                          for record in exported_records], records)
        # Clear only this isolated test context, then restore via the real file input.
        self.page.evaluate('localStorage.clear()')
        self.open_place('回顾花园')
        expect(self.page.locator('.garden-empty')).to_be_visible()
        with self.page.expect_event('dialog') as event:
            self.page.locator('#importFile').set_input_files({
                'name': 'backup.json', 'mimeType': 'application/json', 'buffer': content})
        self.assertIn('导入成功', event.value.message)
        event.value.accept()
        expect(self.page.locator('.record-empathy')).to_have_count(1)
        self.assertEqual(self.state()['empathyRecords'], exported_records)
        self.open_place('回顾花园')
        self.assertEqual(self.state()['empathyRecords'], exported_records)

    def test_crisis_keyword_sets_notice_flag(self):
        # This existing implementation flags the notice within step 1, which then
        # hides. This verifies keyword detection, not visibility or clinical value.
        for text in ['我不想活了', '我想自杀', '想伤害自己']:
            with self.subTest(text=text):
                self.open_place('共情小屋')
                self.page.locator('#empathySituation').fill(text)
                self.page.locator('#empathyStep1 .btn-primary').click()
                expect(self.page.locator('#crisisNotice')).not_to_have_class('safety-notice hidden')
                expect(self.page.locator('#empathyStep2')).to_be_visible()


if __name__ == '__main__':
    unittest.main()
