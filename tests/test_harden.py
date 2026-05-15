#!/usr/bin/env python3
"""
本地指南游戏 MVP - Playwright 自动化测试 (加固版)
覆盖：移动端布局、JSON导入安全、危机关键词检测
"""

from playwright.sync_api import sync_playwright
import json
import os
import time

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
        print("测试1: 移动端响应式布局 (iPhone)")
        print("=" * 60)
        
        try:
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto('http://localhost:5173', wait_until='networkidle')
            
            if page.locator('h1:has-text("本地指南游戏")').is_visible():
                log_result("iPhone首页标题", "通过")
            else:
                log_result("iPhone首页标题", "失败")
            
            if page.locator('.module-card').first.is_visible():
                log_result("iPhone模块卡片可见", "通过")
            else:
                log_result("iPhone模块卡片可见", "失败")
            
            page.locator('.module-card:has-text("共情小屋")').click()
            page.wait_for_load_state('networkidle')
            
            if page.locator('#empathySituation').is_visible():
                log_result("iPhone共情小屋输入框可见", "通过")
            else:
                log_result("iPhone共情小屋输入框可见", "失败")
                
        except Exception as e:
            log_result("iPhone移动端测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试2: 移动端响应式布局 (Android)")
        print("=" * 60)
        
        try:
            page.set_viewport_size({"width": 360, "height": 740})
            page.goto('http://localhost:5173', wait_until='networkidle')
            
            if page.locator('h1:has-text("本地指南游戏")').is_visible():
                log_result("Android首页标题", "通过")
            else:
                log_result("Android首页标题", "失败")
            
            if page.locator('button:has-text("开始今日探索")').is_visible():
                log_result("Android主按钮可见", "通过")
            else:
                log_result("Android主按钮可见", "失败")
                
        except Exception as e:
            log_result("Android移动端测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试3: 移动端响应式布局 (平板窄屏)")
        print("=" * 60)
        
        try:
            page.set_viewport_size({"width": 768, "height": 1024})
            page.goto('http://localhost:5173', wait_until='networkidle')
            
            if page.locator('h1:has-text("本地指南游戏")').is_visible():
                log_result("平板窄屏首页", "通过")
            else:
                log_result("平板窄屏首页", "失败")
                
        except Exception as e:
            log_result("平板窄屏测试", "失败", str(e))
        
        page.set_viewport_size({"width": 1280, "height": 800})
        
        print("\n" + "=" * 60)
        print("测试4: 异常JSON导入处理")
        print("=" * 60)
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.locator('.module-card:has-text("回顾花园")').click()
            page.wait_for_load_state('networkidle')
            
            test_cases = [
                ("空字符串", ""),
                ("非JSON文本", "这不是JSON"),
                ("JSON数组", '["test", "data"]'),
                ("缺少version", '{"empathyRecords": []}'),
                ("缺少meta", '{"version": "0.1.0"}'),
            ]
            
            for name, data in test_cases:
                result = page.evaluate(f'''(data) => {{
                    try {{
                        const result = importData(data);
                        return result;
                    }} catch(e) {{
                        return {{ success: false, error: e.message }};
                    }}
                }}''', data)
                
                if not result.get('success', True):
                    log_result(f"异常JSON-{name}被拒绝", "通过")
                else:
                    log_result(f"异常JSON-{name}被拒绝", "失败", "未被正确拒绝")
                    
        except Exception as e:
            log_result("异常JSON导入测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试5: 合法JSON导入恢复")
        print("=" * 60)
        
        try:
            test_data = {
                "version": "0.1.0",
                "empathyRecords": [
                    {"timestamp": "2026-05-15T10:00:00Z", "situation": "测试"}
                ],
                "statusRecords": [],
                "habits": [],
                "habitLogs": [],
                "priorityRecords": [],
                "meta": {
                    "createdAt": "2026-05-15T10:00:00Z",
                    "updatedAt": "2026-05-15T10:00:00Z"
                }
            }
            
            test_json = json.dumps(test_data)
            result = page.evaluate(f'''(jsonStr) => {{
                try {{
                    const result = importData(jsonStr);
                    return result;
                }} catch(e) {{
                    return {{ success: false, error: e.message }};
                }}
            }}''', test_json)
            
            if result.get('success', False):
                log_result("合法JSON导入", "通过")
                
                page.reload(wait_until='networkidle')
                page.locator('.module-card:has-text("回顾花园")').click()
                page.wait_for_load_state('networkidle')
                
                if page.locator('.review-section:has-text("共情记录")').is_visible():
                    log_result("导入后数据恢复", "通过")
                else:
                    log_result("导入后数据恢复", "失败")
            else:
                log_result("合法JSON导入", "失败", f"导入失败: {result.get('error', '')}")
                
        except Exception as e:
            log_result("合法JSON导入测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试6: 危机关键词检测")
        print("=" * 60)
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.locator('.module-card:has-text("共情小屋")').click()
            page.wait_for_load_state('networkidle')
            
            crisis_keywords = [
                "我不想活了",
                "我想自杀",
                "想结束自己的生命",
                "活着没意思想死",
                "想伤害自己"
            ]
            
            for keyword in crisis_keywords:
                page.goto('http://localhost:5173', wait_until='networkidle')
                page.locator('.module-card:has-text("共情小屋")').click()
                page.wait_for_load_state('networkidle')
                
                page.locator('#empathySituation').fill(keyword)
                page.wait_for_timeout(200)
                page.locator('#empathyStep1 button:has-text("下一步")').click()
                page.wait_for_timeout(500)
                
                crisis_visible = page.evaluate('''() => {
                    const el = document.getElementById('crisisNotice');
                    return el ? !el.classList.contains('hidden') : false;
                }''')
                
                if crisis_visible:
                    log_result(f"危机提示-{keyword[:8]}", "通过")
                else:
                    log_result(f"危机提示-{keyword[:8]}", "失败", "未显示危机提示")
                    
        except Exception as e:
            log_result("危机关键词检测", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试7: 普通输入不误触发危机提示")
        print("=" * 60)
        
        try:
            normal_inputs = [
                "今天工作很累",
                "和同事沟通不畅",
                "考试没考好很失落",
                "感觉压力有点大"
            ]
            
            all_passed = True
            for input_text in normal_inputs:
                page.goto('http://localhost:5173', wait_until='networkidle')
                page.locator('.module-card:has-text("共情小屋")').click()
                page.wait_for_load_state('networkidle')
                
                page.locator('#empathySituation').fill(input_text)
                page.locator('#empathyStep1 button:has-text("下一步")').click()
                page.wait_for_timeout(500)
                
                crisis_visible = page.evaluate('''() => {
                    const el = document.getElementById('crisisNotice');
                    return el ? !el.classList.contains('hidden') : false;
                }''')
                
                if crisis_visible:
                    all_passed = False
                    log_result(f"正常输入-{input_text[:6]}", "失败", "误触发危机提示")
                    break
            
            if all_passed:
                log_result("正常输入不误触发", "通过")
                
        except Exception as e:
            log_result("正常输入测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试8: 危机提示后仍可继续流程")
        print("=" * 60)
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.locator('.module-card:has-text("共情小屋")').click()
            page.wait_for_load_state('networkidle')
            
            page.locator('#empathySituation').fill("我想自杀")
            page.locator('#empathyStep1 button:has-text("下一步")').click()
            page.wait_for_timeout(500)
            
            crisis_visible = page.evaluate('''() => {
                const el = document.getElementById('crisisNotice');
                return el ? !el.classList.contains('hidden') : false;
            }''')
            
            if crisis_visible:
                page.locator('#empathyStep2 button:has-text("下一步")').click()
                page.wait_for_timeout(500)
                
                if page.locator('#empathyStep3').is_visible():
                    log_result("危机提示后可继续", "通过")
                else:
                    log_result("危机提示后可继续", "失败")
            else:
                log_result("危机提示后可继续", "失败", "未显示危机提示")
                
        except Exception as e:
            log_result("危机提示后继续测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试9: 控制台错误检查")
        print("=" * 60)
        
        if console_errors:
            log_result("控制台错误", "失败", f"发现{len(console_errors)}个错误")
            for err in console_errors[:3]:
                print(f"    - {err[:100]}")
        else:
            log_result("控制台错误", "通过", "无错误")
        
        browser.close()
        
        print("\n" + "=" * 60)
        print("测试总结")
        print("=" * 60)
        
        passed = sum(1 for r in TEST_RESULTS if r[1] == "通过")
        total = len(TEST_RESULTS)
        print(f"通过: {passed}/{total}")
        print()
        
        for name, status, detail in TEST_RESULTS:
            symbol = "✓" if status == "通过" else "✗" if status == "失败" else "○"
            print(f"  {symbol} [{status}] {name}" + (f": {detail}" if detail else ""))
        
        return TEST_RESULTS

if __name__ == '__main__':
    print("本地指南游戏 MVP - Playwright 加固测试")
    print("运行环境: http://localhost:5173")
    print()
    
    try:
        results = run_tests()
        print("\n测试完成")
    except Exception as e:
        print(f"\n测试失败: {e}")
