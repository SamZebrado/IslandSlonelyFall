"""Isolated local browser fixture; no browser installation or external server needed."""
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import threading
import unittest

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (BrokenPipeError, ConnectionResetError):
            # Navigating away cancels in-flight media requests.
            pass


class BrowserTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(
            ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
        cls.addClassCleanup(cls.server.server_close)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.addClassCleanup(cls.thread.join, 5)
        cls.addClassCleanup(cls.server.shutdown)
        cls.url = 'http://127.0.0.1:%d' % cls.server.server_port
        cls.playwright = sync_playwright().start()
        cls.addClassCleanup(cls.playwright.stop)
        options = {'headless': True}
        executable = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH')
        if executable:
            options['executable_path'] = executable
        cls.browser = cls.playwright.chromium.launch(**options)
        cls.addClassCleanup(cls.browser.close)

    def setUp(self):
        self.context = self.browser.new_context(locale='zh-CN')
        self.addCleanup(self.context.close)
        self.page = self.context.new_page()
        self.page.set_default_timeout(5000)
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.on('console', lambda message: self.errors.append(message.text)
                     if message.type == 'error' else None)
        self.addCleanup(self.assertEqual, self.errors, [], 'Browser errors')
        self.page.goto(self.url, wait_until='load')
        expect(self.page.locator('h1')).to_have_text('慢慢倒')

    def open_place(self, name):
        self.page.goto(self.url, wait_until='load')
        self.page.locator('.place-card').filter(has_text=name).click()

    def state(self):
        return self.page.evaluate("JSON.parse(localStorage.getItem('localGuideGameState'))")

    def prepare_empathy(self):
        self.open_place('共情小屋')
        self.page.locator('#empathySituation').fill('测试：会议后需要休息')
        self.page.locator('#empathyStep1 .btn-primary').click()
        expect(self.page.locator('#empathyStep2')).to_be_visible()
        self.page.locator('.feeling-chip').first.click()
        self.page.locator('#empathyStep2 .btn-primary').click()
        expect(self.page.locator('#empathyStep3')).to_be_visible()
        self.page.locator('.need-chip').first.click()
        self.page.locator('#empathyStep3 .btn-primary').click()
        expect(self.page.locator('#empathyStep3b')).to_be_visible()
        self.page.locator('#empathyRequest').fill('测试：休息两分钟')
        self.page.locator('#empathyStep3b .btn-primary').click()
        expect(self.page.locator('#empathyStep4')).to_be_visible()

    def finish_empathy(self, audience='self', mode='journal', tone='gentle'):
        for key, value in [('audience', audience), ('mode', mode), ('tone', tone)]:
            self.page.locator('#empathyStep4 [data-%s="%s"]' % (key, value)).click()
        expect(self.page.locator('#generateExpressionBtn')).to_be_enabled()
        self.page.locator('#generateExpressionBtn').click()
        expect(self.page.locator('#empathyResult')).to_be_visible()
        expect(self.page.locator('.empathy-step:visible')).to_have_count(0)

    def create_habit(self, action='测试：喝一杯水'):
        self.page.locator('[onclick="showCreateHabit()"] ').click()
        self.page.locator('#habitIdentity').fill('测试：照顾自己的人')
        self.page.locator('#habitAction').fill(action)
        self.page.locator('#createHabitForm .btn-primary').click()
        item = self.page.locator('.habit-item').filter(has_text=action)
        expect(item).to_be_visible()
        return item
