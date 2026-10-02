#!/usr/bin/env python3
"""Audio asset/controller state checks; no claim about audible playback."""
import unittest
from playwright.sync_api import expect
from browser_harness import BrowserTest, ROOT


class AudioTests(BrowserTest):
    def test_assets_and_user_initiated_controller_state(self):
        for name in ['cloud_harbor_theme.wav', 'empathy_room_loop.wav', 'review_garden_loop.wav']:
            self.assertGreater((ROOT / 'assets/audio' / name).stat().st_size, 44)
        self.assertEqual(self.page.evaluate('AudioController.defaultVolume'), 0.2)
        expect(self.page.locator('#audioControl')).to_be_hidden()
        self.page.locator('h1').click()
        self.page.wait_for_function('AudioController.audioElement.readyState >= 2')
        self.assertEqual(self.page.evaluate('AudioController.currentTrack'), 'cloudHarbor')
        # The first-click handler loads the track; play remains an explicit action.
        self.assertFalse(self.page.evaluate('AudioController.isPlaying'))
        self.page.evaluate('toggleAudio()')
        self.page.wait_for_function('AudioController.isPlaying && !AudioController.audioElement.paused')
        expect(self.page.locator('#audioControl')).to_be_visible()
        expect(self.page.locator('#audioToggleBtn')).to_have_text('🔊')
        self.page.locator('#audioToggleBtn').click()
        self.assertFalse(self.page.evaluate('AudioController.isPlaying'))
        self.assertTrue(self.page.evaluate('AudioController.audioElement.paused'))
        expect(self.page.locator('#audioToggleBtn')).to_have_text('🔇')


    def test_bad_audio_does_not_block_core_navigation(self):
        # Serve an invalid audio payload with HTTP 200, then wait for the media
        # decoder's error. The application must remain usable afterwards.
        self.page.route('**/assets/audio/cloud_harbor_theme.wav',
                        lambda route: route.fulfill(status=200, content_type='audio/wav', body='invalid audio'))
        self.page.locator('.place-empathy').click()
        self.page.wait_for_function('AudioController.audioElement.error !== null')
        self.page.locator('#empathySituation').fill('测试：音频失败后仍可输入')
        self.page.locator('#empathyStep1 .btn-primary').click()
        expect(self.page.locator('#empathyStep2')).to_be_visible()


if __name__ == '__main__':
    unittest.main()
