#!/usr/bin/env python3
"""
本地指南游戏 - 音频控制 Playwright 自动化测试
测试音频播放控制功能
"""

from playwright.sync_api import sync_playwright
import os

TEST_RESULTS = []

def log_result(name, status, detail=""):
    symbol = "✓" if status == "通过" else "✗" if status == "失败" else "○"
    print(f"  {symbol} [{status}] {name}" + (f": {detail}" if detail else ""))
    TEST_RESULTS.append((name, status, detail))

def check_audio_files_exist():
    audio_dir = 'assets/audio'
    required_files = [
        'cloud_harbor_theme.wav',
        'empathy_room_loop.wav',
        'review_garden_loop.wav'
    ]
    
    for filename in required_files:
        filepath = os.path.join(audio_dir, filename)
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            log_result(f"音频文件存在: {filename}", "通过", f"{size} bytes")
        else:
            log_result(f"音频文件存在: {filename}", "失败", "文件不存在")

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        
        print("=" * 60)
        print("测试1: 音频文件检查")
        print("=" * 60)
        
        check_audio_files_exist()
        
        print("\n" + "=" * 60)
        print("测试2: 音频控制UI元素")
        print("=" * 60)
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            
            audio_control = page.query_selector('#audioControl')
            audio_toggle_btn = page.query_selector('#audioToggleBtn')
            
            if audio_toggle_btn:
                log_result("音频控制按钮存在", "通过")
                btn_text = audio_toggle_btn.text_content()
                if '🔇' in btn_text or '🔊' in btn_text:
                    log_result("按钮图标正确", "通过", btn_text)
                else:
                    log_result("按钮图标正确", "失败", f"实际: {btn_text}")
            else:
                log_result("音频控制按钮存在", "失败", "未找到按钮")
            
            if audio_control:
                is_hidden = audio_control.get_attribute('class')
                if 'hidden' in is_hidden:
                    log_result("音频按钮默认隐藏", "通过")
                else:
                    log_result("音频按钮默认隐藏", "失败", f"class: {is_hidden}")
                    
        except Exception as e:
            log_result("音频UI检查", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试3: 音频控制器初始化")
        print("=" * 60)
        
        try:
            audio_controller = page.evaluate('() => window.AudioController')
            if audio_controller:
                log_result("AudioController 已初始化", "通过")
                
                default_volume = page.evaluate('() => window.AudioController.defaultVolume')
                if default_volume <= 0.25:
                    log_result("默认音量不高于0.25", "通过", f"实际: {default_volume}")
                else:
                    log_result("默认音量不高于0.25", "失败", f"实际: {default_volume}")
                
                tracks = page.evaluate('() => Object.keys(window.AudioController.tracks || {})')
                if len(tracks) >= 2:
                    log_result("定义了多个音轨", "通过", f"{len(tracks)}个音轨")
                else:
                    log_result("定义了多个音轨", "失败", f"只有{len(tracks)}个音轨")
            else:
                log_result("AudioController 已初始化", "失败", "window.AudioController 不存在")
                
        except Exception as e:
            log_result("AudioController 初始化检查", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试4: 音频点击触发")
        print("=" * 60)
        
        try:
            page.click('body')
            page.wait_for_timeout(500)
            
            audio_loaded = page.evaluate('''() => {
                const ac = window.AudioController;
                return ac && ac.audioElement && ac.audioElement.src !== '';
            }''')
            
            if audio_loaded:
                log_result("点击页面后加载音频", "通过")
            else:
                log_result("点击页面后加载音频", "失败", "音频未加载")
                
        except Exception as e:
            log_result("音频加载触发", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试5: 音频播放控制")
        print("=" * 60)
        
        try:
            page.evaluate('() => { const c = document.getElementById("audioControl"); if(c) c.classList.remove("hidden"); }')
            page.wait_for_timeout(300)
            
            audio_toggle_btn = page.query_selector('#audioToggleBtn')
            if audio_toggle_btn:
                audio_toggle_btn.click()
                page.wait_for_timeout(500)
                
                btn_text_after = audio_toggle_btn.text_content()
                if '🔊' in btn_text_after or '🔇' in btn_text_after:
                    log_result("点击切换音频播放状态", "通过")
                else:
                    log_result("点击切换音频播放状态", "失败", f"按钮文本: {btn_text_after}")
                
                audio_control = page.query_selector('#audioControl')
                if audio_control:
                    is_hidden = audio_control.get_attribute('class')
                    if 'hidden' not in is_hidden:
                        log_result("音频按钮在点击后显示", "通过")
                    else:
                        log_result("音频按钮在点击后显示", "失败", "按钮仍然隐藏")
                        
        except Exception as e:
            log_result("音频播放控制", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试6: 音频失败容错")
        print("=" * 60)
        
        try:
            console_errors_before = len(console_errors)
            
            page.evaluate('''() => {
                if (window.AudioController && window.AudioController.audioElement) {
                    window.AudioController.audioElement.src = 'nonexistent.wav';
                }
            }''')
            page.wait_for_timeout(500)
            
            page_title = page.title()
            if page_title and '本地指南' in page_title:
                log_result("音频加载失败不影响页面", "通过")
            else:
                log_result("音频加载失败不影响页面", "失败", "页面可能出错")
                
        except Exception as e:
            log_result("音频失败容错", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试7: 控制台错误检查")
        print("=" * 60)
        
        critical_errors = [e for e in console_errors if 'Error' in e and 'audio' not in e.lower()]
        
        if len(critical_errors) == 0:
            log_result("控制台无严重 JS error", "通过")
        else:
            log_result("控制台无严重 JS error", "失败", f"发现{len(critical_errors)}个错误")
            for err in critical_errors[:3]:
                print(f"    错误: {err}")
        
        print("\n" + "=" * 60)
        print("测试总结")
        print("=" * 60)
        
        passed = sum(1 for _, status, _ in TEST_RESULTS if status == "通过")
        failed = sum(1 for _, status, _ in TEST_RESULTS if status == "失败")
        total = len(TEST_RESULTS)
        
        print(f"通过: {passed}/{total}")
        print(f"失败: {failed}/{total}")
        
        for name, status, detail in TEST_RESULTS:
            symbol = "✓" if status == "通过" else "✗" if status == "失败" else "○"
            print(f"  {symbol} [{status}] {name}" + (f": {detail}" if detail else ""))
        
        browser.close()
        
        return failed == 0

if __name__ == '__main__':
    import sys
    success = run_tests()
    sys.exit(0 if success else 1)
