#!/usr/bin/env python3
"""
本地指南游戏 - 表达调音台 Playwright 自动化测试
测试表达调音台功能：沟通对象、表达方式、语气选择和表达建议生成
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
        print("测试1: 表达调音台基础功能")
        print("=" * 60)
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('button:has-text("开始今日探索")')
            page.wait_for_selector('.empathy-step')
            
            page.click('button:has-text("下一步")')
            page.wait_for_selector('#empathyStep2')
            log_result("共情步骤2显示", "通过")
            
            page.click('button:has-text("下一步")')
            page.wait_for_selector('#empathyStep3')
            log_result("共情步骤3显示", "通过")
            
            page.click('button:has-text("下一步")')
            page.wait_for_selector('#empathyStep3b')
            log_result("共情步骤4显示", "通过")
            
            page.click('button:has-text("下一步")')
            page.wait_for_selector('#empathyStep4')
            log_result("步骤5（表达调音台）显示", "通过")
            
            page.wait_for_selector('.expression-tuner-card')
            log_result("表达调音台卡片可见", "通过")
            
            page.wait_for_selector('[data-audience]')
            log_result("沟通对象选择器可见", "通过")
            
            page.wait_for_selector('[data-mode]')
            log_result("表达方式选择器可见", "通过")
            
            page.wait_for_selector('[data-tone]')
            log_result("语气强度选择器可见", "通过")
            
        except Exception as e:
            log_result("基础导航测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试2: 表达调音台选择功能")
        print("=" * 60)
        
        try:
            page.click('[data-audience="self"]')
            log_result("选择沟通对象：自己", "通过")
            
            page.click('[data-mode="journal"]')
            log_result("选择表达方式：只记录", "通过")
            
            page.click('[data-tone="gentle"]')
            log_result("选择语气：温和", "通过")
            
            generate_btn = page.query_selector('#generateExpressionBtn')
            is_disabled = generate_btn.get_attribute('disabled')
            if is_disabled is None:
                log_result("按钮在所有选项选择后可用", "通过")
            else:
                log_result("按钮在所有选项选择后可用", "失败", "按钮仍然禁用")
                
        except Exception as e:
            log_result("选择功能测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试3: 表达建议生成")
        print("=" * 60)
        
        try:
            page.click('#generateExpressionBtn')
            page.wait_for_selector('#empathyResult')
            log_result("生成表达后显示结果", "通过")
            
            expression_cards = page.query_selector_all('.expression-card')
            if len(expression_cards) > 0:
                log_result("生成了表达建议", "通过", f"共{len(expression_cards)}条建议")
            else:
                log_result("生成了表达建议", "失败", "未找到建议卡片")
                
        except Exception as e:
            log_result("表达生成测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试4: 不同场景的表达建议")
        print("=" * 60)
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('button:has-text("开始今日探索")')
            page.wait_for_selector('.empathy-step')
            
            for _ in range(4):
                page.click('button:has-text("下一步")')
                page.wait_for_timeout(200)
            
            page.wait_for_selector('#empathyStep4')
            
            page.click('[data-audience="partnerFriend"]')
            page.click('[data-mode="faceToFace"]')
            page.click('[data-tone="gentle"]')
            page.click('#generateExpressionBtn')
            page.wait_for_selector('#empathyResult')
            
            action_suggestion = page.query_selector('.action-suggestion')
            if action_suggestion:
                log_result("当面说场景显示动作建议", "通过")
            else:
                log_result("当面说场景显示动作建议", "失败", "未找到动作建议")
                
        except Exception as e:
            log_result("当面说场景测试", "失败", str(e))
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('button:has-text("开始今日探索")')
            page.wait_for_selector('.empathy-step')
            
            for _ in range(4):
                page.click('button:has-text("下一步")')
                page.wait_for_timeout(200)
            
            page.wait_for_selector('#empathyStep4')
            
            page.click('[data-audience="supervisor"]')
            page.click('[data-mode="message"]')
            page.click('[data-tone="clear"]')
            page.click('#generateExpressionBtn')
            page.wait_for_selector('#empathyResult')
            
            action_suggestion = page.query_selector('.action-suggestion')
            if action_suggestion:
                log_result("发消息场景显示发送前检查", "通过")
            else:
                log_result("发消息场景显示发送前检查", "失败", "未找到发送前检查")
                
        except Exception as e:
            log_result("发消息场景测试", "失败", str(e))
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('button:has-text("开始今日探索")')
            page.wait_for_selector('.empathy-step')
            
            for _ in range(4):
                page.click('button:has-text("下一步")')
                page.wait_for_timeout(200)
            
            page.wait_for_selector('#empathyStep4')
            
            page.click('[data-audience="unsafePerson"]')
            page.click('[data-mode="boundary"]')
            page.click('[data-tone="boundary"]')
            page.click('#generateExpressionBtn')
            page.wait_for_selector('#empathyResult')
            
            expression_cards = page.query_selector_all('.expression-card')
            if len(expression_cards) > 0:
                log_result("暂不适合沟通场景生成边界建议", "通过", f"共{len(expression_cards)}条建议")
            else:
                log_result("暂不适合沟通场景生成边界建议", "失败", "未找到边界建议")
                
        except Exception as e:
            log_result("暂不适合沟通场景测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试5: localStorage 保存")
        print("=" * 60)
        
        try:
            page.evaluate('() => localStorage.clear()')
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('button:has-text("开始今日探索")')
            page.wait_for_selector('.empathy-step')
            
            for _ in range(4):
                page.click('button:has-text("下一步")')
                page.wait_for_timeout(200)
            
            page.wait_for_selector('#empathyStep4')
            page.click('[data-audience="self"]')
            page.click('[data-mode="journal"]')
            page.click('[data-tone="gentle"]')
            page.click('#generateExpressionBtn')
            page.wait_for_selector('#empathyResult')
            
            state_json = page.evaluate('() => localStorage.getItem("localGuideGameState")')
            if state_json:
                state = page.evaluate('() => JSON.parse(localStorage.getItem("localGuideGameState"))')
                if 'empathyRecords' in state and len(state['empathyRecords']) > 0:
                    record = state['empathyRecords'][0]
                    if 'expressionTuner' in record:
                        log_result("expressionTuner 字段保存到 localStorage", "通过")
                    else:
                        log_result("expressionTuner 字段保存到 localStorage", "失败", "record 中无 expressionTuner 字段")
                else:
                    log_result("共情记录保存", "失败", "无记录或格式错误")
            else:
                log_result("localStorage 数据存在", "失败", "未找到 localGuideGameState")
                
        except Exception as e:
            log_result("localStorage 保存测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试6: 移动端响应式")
        print("=" * 60)
        
        try:
            page.set_viewport_size({"width": 375, "height": 667})
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('button:has-text("开始今日探索")')
            page.wait_for_selector('.empathy-step')
            
            for _ in range(4):
                page.click('button:has-text("下一步")')
                page.wait_for_timeout(200)
            
            page.wait_for_selector('#empathyStep4')
            
            audience_btns = page.query_selector_all('[data-audience]')
            mode_btns = page.query_selector_all('[data-mode]')
            tone_btns = page.query_selector_all('[data-tone]')
            
            if len(audience_btns) >= 6:
                log_result("移动端沟通对象选择器可用", "通过")
            else:
                log_result("移动端沟通对象选择器可用", "失败", f"只有{len(audience_btns)}个按钮")
                
        except Exception as e:
            log_result("移动端响应式测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试7: 控制台错误检查")
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
