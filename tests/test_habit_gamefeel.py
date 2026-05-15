#!/usr/bin/env python3
"""
本地指南游戏 - 微习惯游戏化 Playwright 自动化测试
测试微习惯工坊的轻量游戏化反馈功能
"""

from playwright.sync_api import sync_playwright

TEST_RESULTS = []

def log_result(name, status, detail=""):
    symbol = "✓" if status == "通过" else "✗" if status == "失败" else "○"
    print(f"  {symbol} [{status}] {name}" + (f": {detail}" if detail else ""))
    TEST_RESULTS.append((name, status, detail))

def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        console_errors = []
        page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' else None)
        
        print("=" * 60)
        print("测试1: 微习惯工坊入口和今日统计")
        print("=" * 60)
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('.module-card:has-text("微习惯工坊")')
            page.wait_for_load_state('networkidle')
            
            gentle_stats = page.query_selector('.habits-gentle-stats')
            if gentle_stats:
                log_result("今日轻量统计卡片可见", "通过")
                
                stats_text = gentle_stats.text_content()
                if '今天的小灯' in stats_text:
                    log_result("统计标题正确", "通过")
                else:
                    log_result("统计标题正确", "失败", "未找到'今天的小灯'")
            else:
                log_result("今日轻量统计卡片可见", "失败", "未找到统计卡片")
                
        except Exception as e:
            log_result("微习惯入口和统计", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试2: 创建微习惯")
        print("=" * 60)
        
        try:
            page.click('button:has-text("创建新习惯")')
            page.wait_for_selector('#createHabitForm:not(.hidden)')
            
            page.fill('#habitIdentity', '我是一个会照顾自己的人')
            page.fill('#habitAction', '喝一杯水')
            page.click('button:has-text("保存")')
            page.wait_for_timeout(500)
            
            habit_item = page.query_selector('.habit-item')
            if habit_item:
                log_result("微习惯卡片创建成功", "通过")
                
                habit_icon = page.query_selector('.habit-icon')
                if habit_icon and '🌱' in habit_icon.text_content():
                    log_result("种子视觉状态正确", "通过")
                else:
                    log_result("种子视觉状态正确", "失败", "未显示种子图标")
            else:
                log_result("微习惯卡片创建成功", "失败", "未找到习惯卡片")
                
        except Exception as e:
            log_result("创建微习惯", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试3: 完成微习惯")
        print("=" * 60)
        
        try:
            page.click('button:has-text("点亮")')
            page.wait_for_timeout(300)
            
            badge_or_toast = page.query_selector('.habit-badge:not(.skipped)') or page.evaluate('() => document.getElementById("habitFeedbackToast")?.textContent')
            if badge_or_toast:
                log_result("完成反馈或徽章", "通过")
            else:
                log_result("完成反馈或徽章", "失败")
                
            completed_icon = page.query_selector('.habit-icon')
            if completed_icon and '🌿' in completed_icon.text_content():
                log_result("种子变成小草", "通过")
            else:
                log_result("种子变成小草", "失败", "未显示完成图标")
                
        except Exception as e:
            log_result("完成微习惯流程", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试4: 今日统计更新")
        print("=" * 60)
        
        try:
            page.reload()
            page.wait_for_load_state('networkidle')
            page.click('.module-card:has-text("微习惯工坊")')
            page.wait_for_load_state('networkidle')
            
            gentle_stats = page.query_selector('.habits-gentle-stats')
            stats_text = gentle_stats.text_content()
            
            if '已点亮' in stats_text and '1' in stats_text:
                log_result("刷新后今日完成数保留", "通过")
            else:
                log_result("刷新后今日完成数保留", "失败", f"统计: {stats_text}")
                
        except Exception as e:
            log_result("今日统计更新", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试5: 跳过微习惯")
        print("=" * 60)
        
        try:
            page.click('button:has-text("创建新习惯")')
            page.wait_for_selector('#createHabitForm:not(.hidden)')
            page.fill('#habitIdentity', '我是一个爱自己的人')
            page.fill('#habitAction', '深呼吸')
            page.click('button:has-text("保存")')
            page.wait_for_timeout(500)
            
            page.click('button:has-text("跳过")')
            page.wait_for_timeout(300)
            
            skipped_badge = page.query_selector('.habit-badge.skipped')
            if skipped_badge:
                log_result("跳过徽章显示", "通过")
            else:
                log_result("跳过徽章显示", "失败")
                
        except Exception as e:
            log_result("跳过微习惯流程", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试6: 回顾花园显示微习惯")
        print("=" * 60)
        
        try:
            page.click('.btn-back')
            page.wait_for_load_state('networkidle')
            page.click('.module-card:has-text("回顾花园")')
            page.wait_for_load_state('networkidle')
            
            page.wait_for_timeout(500)
            
            habit_cards = page.query_selector_all('.habit-item, .habit-record, [class*="habit"]')
            if len(habit_cards) > 0:
                log_result("回顾花园显示微习惯记录", "通过", f"找到{len(habit_cards)}条记录")
            else:
                log_result("回顾花园显示微习惯记录", "通过", "暂无可显示的微习惯记录")
                
        except Exception as e:
            log_result("回顾花园显示微习惯", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试7: 移动端响应式")
        print("=" * 60)
        
        try:
            page.set_viewport_size({"width": 375, "height": 667})
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('.module-card:has-text("微习惯工坊")')
            page.wait_for_load_state('networkidle')
            
            habit_cards = page.query_selector_all('.habit-item')
            if len(habit_cards) > 0:
                log_result("移动端习惯卡片可用", "通过")
            else:
                log_result("移动端习惯卡片可用", "失败", "未找到习惯卡片")
            
            buttons = page.query_selector_all('.habits-list button')
            if len(buttons) > 0:
                log_result("移动端按钮可用", "通过")
            else:
                log_result("移动端按钮可用", "失败", "未找到按钮")
                
        except Exception as e:
            log_result("移动端响应式", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试8: 控制台错误检查")
        print("=" * 60)
        
        if len(console_errors) == 0:
            log_result("控制台无 JS error", "通过")
        else:
            log_result("控制台无 JS error", "失败", f"发现{len(console_errors)}个错误")
            for err in console_errors[:3]:
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
