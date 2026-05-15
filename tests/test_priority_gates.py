#!/usr/bin/env python3
"""
本地指南游戏 - 优先级决策岛五道门 Playwright 自动化测试
测试五道门游戏路径功能
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
        print("测试1: 五道门路径显示")
        print("=" * 60)
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('.module-card:has-text("优先级决策岛")')
            page.wait_for_load_state('networkidle')
            
            gate_nodes = page.query_selector_all('.gate-node')
            if len(gate_nodes) >= 5:
                log_result("五道门路径节点显示", "通过", f"共{len(gate_nodes)}个节点")
            else:
                log_result("五道门路径节点显示", "失败", f"只有{len(gate_nodes)}个节点")
            
            page.wait_for_timeout(800)
            first_node = page.query_selector('.gate-node.active')
            if first_node:
                log_result("第一道门高亮", "通过")
            else:
                log_result("第一道门高亮", "失败", "未找到active节点")
                
        except Exception as e:
            log_result("五道门路径显示", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试2: 开始穿越五道门")
        print("=" * 60)
        
        try:
            page.fill('#priorityTask', '完成季度报告')
            page.click('button:has-text("开始穿越五道门")')
            page.wait_for_timeout(500)
            
            gate_card = page.query_selector('.gate-card:not(.hidden)')
            if gate_card:
                log_result("开始穿越五道门", "通过")
                
                gate_title = page.query_selector('.gate-header h3')
                if gate_title and '放下门' in gate_title.text_content():
                    log_result("第一道门显示放下门", "通过")
                else:
                    log_result("第一道门显示放下门", "失败")
            else:
                log_result("开始穿越五道门", "失败", "门卡片未显示")
                
        except Exception as e:
            log_result("开始穿越测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试3: 通过第一道门（选择删除）")
        print("=" * 60)
        
        try:
            page.click('button:has-text("可以删除")')
            page.wait_for_timeout(1500)
            
            completed_nodes = page.query_selector_all('.gate-node.completed')
            if len(completed_nodes) >= 1:
                log_result("第一道门标记为已完成", "通过")
            else:
                log_result("第一道门标记为已完成", "失败")
                
            second_gate = page.query_selector('.gate-header h3')
            if second_gate and '简化门' in second_gate.text_content():
                log_result("进入第二道门", "通过")
            else:
                log_result("进入第二道门", "失败")
                
        except Exception as e:
            log_result("通过第一道门", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试4: 快速完成五道门流程")
        print("=" * 60)
        
        try:
            page.click('button:has-text("可以缩小")')
            page.wait_for_timeout(1500)
            
            page.click('button:has-text("可以求助")')
            page.wait_for_timeout(1500)
            
            page.click('button:has-text("现在适合")')
            page.wait_for_timeout(1500)
            
            page.fill('#focusNextStep', '打开文档写一行')
            page.click('button:has-text("2分钟")')
            page.click('button:has-text("确定最小下一步")')
            page.wait_for_timeout(1500)
            
            result_card = page.query_selector('.priority-result:not(.hidden)')
            if result_card:
                log_result("完成五道门流程", "通过")
            else:
                log_result("完成五道门流程", "失败")
                
        except Exception as e:
            log_result("快速完成流程", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试5: 决策结果验证")
        print("=" * 60)
        
        try:
            result_category = page.query_selector('.result-category')
            if result_category:
                cat_text = result_category.text_content()
                log_result("决策结果显示", "通过", cat_text)
            else:
                log_result("决策结果显示", "失败")
            
            path_summary = page.query_selector('.priority-path-summary')
            if path_summary:
                path_text = path_summary.text_content()
                if '经过' in path_text or '放下' in path_text:
                    log_result("路径摘要显示", "通过")
                else:
                    log_result("路径摘要显示", "失败")
            else:
                log_result("路径摘要显示", "失败")
                
        except Exception as e:
            log_result("决策结果验证", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试6: localStorage保存")
        print("=" * 60)
        
        try:
            state_json = page.evaluate('() => localStorage.getItem("localGuideGameState")')
            if state_json:
                state = page.evaluate('() => JSON.parse(localStorage.getItem("localGuideGameState"))')
                if 'priorityRecords' in state and len(state['priorityRecords']) > 0:
                    record = state['priorityRecords'][0]
                    if 'gatePath' in record:
                        log_result("gatePath保存到localStorage", "通过")
                    else:
                        log_result("gatePath保存到localStorage", "失败", "record中无gatePath字段")
                    
                    if 'decision' in record:
                        log_result("decision保存到localStorage", "通过")
                    else:
                        log_result("decision保存到localStorage", "失败")
                else:
                    log_result("优先级记录保存", "失败", "无记录")
            else:
                log_result("localStorage数据存在", "失败")
                
        except Exception as e:
            log_result("localStorage保存测试", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试7: 回顾花园优先级门票")
        print("=" * 60)
        
        try:
            page.click('.btn-back')
            page.wait_for_load_state('networkidle')
            page.click('.module-card:has-text("回顾花园")')
            page.wait_for_load_state('networkidle')
            
            page.wait_for_timeout(500)
            
            priority_section = page.query_selector('.review-section:has-text("优先级决策")')
            if priority_section:
                priority_items = priority_section.query_selector_all('.record-item')
                if len(priority_items) > 0:
                    log_result("回顾花园显示优先级记录", "通过", f"共{len(priority_items)}条")
                else:
                    log_result("回顾花园显示优先级记录", "失败", "section存在但无record-item")
            else:
                log_result("回顾花园显示优先级记录", "失败", "未找到优先级决策section")
                
        except Exception as e:
            log_result("回顾花园优先级门票", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试8: 移动端响应式")
        print("=" * 60)
        
        try:
            page.set_viewport_size({"width": 375, "height": 667})
            page.goto('http://localhost:5173', wait_until='networkidle')
            page.click('.module-card:has-text("优先级决策岛")')
            page.wait_for_load_state('networkidle')
            
            gate_nodes = page.query_selector_all('.gate-node')
            if len(gate_nodes) >= 5:
                log_result("移动端五道门可用", "通过")
            else:
                log_result("移动端五道门可用", "失败")
                
        except Exception as e:
            log_result("移动端响应式", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试9: 控制台错误检查")
        print("=" * 60)
        
        critical_errors = [e for e in console_errors if 'Error' in e]
        
        if len(critical_errors) == 0:
            log_result("控制台无严重JS error", "通过")
        else:
            log_result("控制台无严重JS error", "失败", f"发现{len(critical_errors)}个错误")
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
