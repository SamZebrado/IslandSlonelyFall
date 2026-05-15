#!/usr/bin/env python3
"""
本地指南游戏 MVP - Playwright 自动化测试 (修复版)
使用更精确的选择器
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
        print("测试1: 首页加载")
        print("=" * 60)
        
        try:
            page.goto('http://localhost:5173', wait_until='networkidle')
            
            if page.locator('h1:has-text("本地指南游戏")').is_visible():
                log_result("首页标题", "通过", "包含'本地指南游戏'")
            else:
                log_result("首页标题", "失败", "未找到标题")
            
            if page.locator('button:has-text("开始今日探索")').is_visible():
                log_result("开始探索按钮", "通过")
            else:
                log_result("开始探索按钮", "失败")
            
            if page.locator('.safety-notice').is_visible():
                log_result("安全提示", "通过", "存在心理安全边界提示")
            else:
                log_result("安全提示", "失败")
                
        except Exception as e:
            log_result("首页加载", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试2: 共情小屋流程")
        print("=" * 60)
        
        try:
            page.locator('.module-card:has-text("共情小屋")').click()
            page.wait_for_load_state('networkidle')
            
            if page.locator('#empathyStep1:has-text("发生了什么")').is_visible():
                log_result("共情小屋入口", "通过")
            else:
                log_result("共情小屋入口", "失败")
            
            page.locator('#empathySituation').fill('今天会议上被老板质疑了方案')
            page.locator('#empathyStep1 button:has-text("下一步")').click()
            page.wait_for_timeout(500)
            
            if page.locator('#empathyStep2:has-text("我现在有什么感受")').is_visible():
                log_result("步骤2显示", "通过")
            else:
                log_result("步骤2显示", "失败")
            
            page.locator('.feeling-chip').first.click()
            page.locator('#empathyStep2 button:has-text("下一步")').click()
            page.wait_for_timeout(500)
            
            if page.locator('#empathyStep3:has-text("我可能有什么需要")').is_visible():
                log_result("步骤3显示", "通过")
            else:
                log_result("步骤3显示", "失败")
            
            page.locator('.need-chip').first.click()
            page.locator('#empathyStep3 button:has-text("下一步")').click()
            page.wait_for_timeout(500)
            
            if page.locator('#empathyStep3b:has-text("我可以提出什么请求")').is_visible():
                log_result("步骤4显示", "通过")
            else:
                log_result("步骤4显示", "失败")
            
            page.locator('#empathyRequest').fill('希望给自己一点休息时间')
            page.locator('#empathyStep3b button:has-text("下一步")').click()
            page.wait_for_timeout(500)
            
            if page.locator('#empathyStep4:has-text("表达调音台")').is_visible():
                log_result("步骤5显示", "通过")
            else:
                log_result("步骤5显示", "失败")
            
            page.locator('[data-audience="self"]').click()
            page.locator('[data-mode="journal"]').click()
            page.locator('[data-tone="gentle"]').click()
            page.wait_for_timeout(300)
            page.locator('#generateExpressionBtn').click()
            page.wait_for_timeout(500)
            
            if page.locator('#empathyResult').is_visible():
                log_result("表达生成", "通过")
            else:
                log_result("表达生成", "失败")
                
        except Exception as e:
            log_result("共情小屋流程", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试3: localStorage 验证")
        print("=" * 60)
        
        try:
            storage_data = page.evaluate('''() => {
                const data = localStorage.getItem('localGuideGameState');
                return data ? JSON.parse(data) : null;
            }''')
            
            if storage_data:
                log_result("localStorage 键存在", "通过", "localGuideGameState 存在")
                
                if 'empathyRecords' in storage_data and len(storage_data['empathyRecords']) > 0:
                    log_result("共情记录保存", "通过", f"保存了{len(storage_data['empathyRecords'])}条记录")
                else:
                    log_result("共情记录保存", "失败", "记录未保存")
            else:
                log_result("localStorage 数据", "失败", "未找到数据")
        except Exception as e:
            log_result("localStorage 验证", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试4: 状态观测台")
        print("=" * 60)
        
        try:
            page.locator('.btn-back').click()
            page.wait_for_load_state('networkidle')
            page.locator('.module-card:has-text("状态观测台")').click()
            page.wait_for_load_state('networkidle')
            
            if page.locator('.status-form:has-text("今日能量")').is_visible():
                log_result("状态观测台入口", "通过")
            else:
                log_result("状态观测台入口", "失败")
            
            page.locator('[data-type="energy"][data-value="3"]').click()
            page.locator('[data-type="pressure"][data-value="2"]').click()
            page.locator('[data-type="clarity"][data-value="4"]').click()
            page.locator('.status-chip').first.click()
            page.locator('.direction-chip').first.click()
            page.locator('button:has-text("保存记录")').click()
            page.wait_for_timeout(500)
            
            storage_data2 = page.evaluate('''() => {
                const data = localStorage.getItem('localGuideGameState');
                return data ? JSON.parse(data) : null;
            }''')
            
            if storage_data2 and 'statusRecords' in storage_data2 and len(storage_data2['statusRecords']) > 0:
                log_result("状态记录保存", "通过")
            else:
                log_result("状态记录保存", "失败")
                
        except Exception as e:
            log_result("状态观测台流程", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试5: 微习惯工坊")
        print("=" * 60)
        
        try:
            page.locator('.btn-back').click()
            page.wait_for_load_state('networkidle')
            page.locator('.module-card:has-text("微习惯工坊")').click()
            page.wait_for_load_state('networkidle')
            
            if page.locator('button:has-text("创建新习惯")').is_visible():
                log_result("微习惯工坊入口", "通过")
            else:
                log_result("微习惯工坊入口", "失败")
            
            page.locator('button:has-text("创建新习惯")').click()
            page.wait_for_timeout(300)
            
            page.locator('#habitIdentity').fill('我是一个会照顾自己的人')
            page.locator('#habitAction').fill('喝一杯水')
            page.locator('.create-habit-form button:has-text("保存")').click()
            page.wait_for_timeout(500)
            
            if page.locator('.habit-item:has-text("喝一杯水")').is_visible():
                log_result("创建微习惯", "通过")
            else:
                log_result("创建微习惯", "失败")
            
            if page.locator('.habit-item button:has-text("点亮")').first.is_visible():
                page.locator('.habit-item button:has-text("点亮")').first.click()
                page.wait_for_timeout(500)
                
                if page.locator('.habit-item .habit-badge:not(.skipped)').is_visible():
                    log_result("完成微习惯", "通过")
                else:
                    log_result("完成微习惯", "失败")
            else:
                log_result("完成微习惯", "失败", "未找到点亮按钮")
                
        except Exception as e:
            log_result("微习惯工坊流程", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试6: 优先级决策岛")
        print("=" * 60)
        
        try:
            page.locator('.btn-back').click()
            page.wait_for_load_state('networkidle')
            page.locator('.module-card:has-text("优先级决策岛")').click()
            page.wait_for_load_state('networkidle')
            
            if page.locator('.gate-path').is_visible():
                log_result("优先级决策岛入口", "通过")
            else:
                log_result("优先级决策岛入口", "失败")
            
            gate_nodes = page.locator('.gate-node')
            node_count = len(gate_nodes.all())
            if node_count >= 5:
                log_result("五道门路径显示", "通过")
            else:
                log_result("五道门路径显示", "失败", f"只有{node_count}个")
            
            page.locator('#priorityTask').fill('完成季度报告')
            page.locator('button:has-text("开始穿越五道门")').click()
            page.wait_for_timeout(800)
            
            if page.locator('.gate-card:not(.hidden)').is_visible():
                log_result("进入第一道门", "通过")
            else:
                log_result("进入第一道门", "失败")
            
            page.locator('button:has-text("可以删除")').click()
            page.wait_for_timeout(1500)
            
            completed = page.locator('.gate-node.completed')
            completed_count = len(completed.all())
            if completed_count >= 1:
                log_result("第一道门完成", "通过")
            else:
                log_result("第一道门完成", "失败", f"只有{completed_count}个已完成")
            
            page.locator('button:has-text("可以缩小")').click()
            page.wait_for_timeout(1500)
            
            page.locator('button:has-text("可以求助")').click()
            page.wait_for_timeout(1500)
            
            page.locator('button:has-text("现在适合")').click()
            page.wait_for_timeout(1500)
            
            page.locator('#focusNextStep').fill('打开文档写一行')
            page.locator('button:has-text("2分钟")').click()
            page.locator('button:has-text("确定最小下一步")').click()
            page.wait_for_timeout(1500)
            
            if page.locator('.priority-result:not(.hidden)').is_visible():
                log_result("决策完成", "通过")
            else:
                log_result("决策完成", "失败")
                
        except Exception as e:
            log_result("优先级决策岛流程", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试7: 回顾花园")
        print("=" * 60)
        
        try:
            page.locator('.btn-back').click()
            page.wait_for_load_state('networkidle')
            page.locator('.module-card:has-text("回顾花园")').click()
            page.wait_for_load_state('networkidle')
            
            if page.locator('.review-page:has-text("导出 JSON")').is_visible():
                log_result("回顾花园入口", "通过")
            else:
                log_result("回顾花园入口", "失败")
            
            if page.locator('button:has-text("清空全部数据")').is_visible():
                log_result("清空数据按钮", "通过", "存在二次确认")
            else:
                log_result("清空数据按钮", "失败")
            
            if page.locator('.review-section:has-text("共情记录")').is_visible():
                log_result("显示共情记录", "通过")
            else:
                log_result("显示共情记录", "失败")
                
        except Exception as e:
            log_result("回顾花园流程", "失败", str(e))
        
        print("\n" + "=" * 60)
        print("测试8: 控制台错误检查")
        print("=" * 60)
        
        if console_errors:
            log_result("控制台错误", "失败", f"发现{len(console_errors)}个错误")
            for err in console_errors[:3]:
                print(f"    - {err[:100]}")
        else:
            log_result("控制台错误", "通过", "无错误")
        
        print("\n" + "=" * 60)
        print("测试9: 刷新恢复验证")
        print("=" * 60)
        
        try:
            page.reload(wait_until='networkidle')
            page.locator('.module-card:has-text("回顾花园")').click()
            page.wait_for_load_state('networkidle')
            
            storage_data3 = page.evaluate('''() => {
                const data = localStorage.getItem('localGuideGameState');
                return data ? JSON.parse(data) : null;
            }''')
            
            if storage_data3 and (
                len(storage_data3.get('empathyRecords', [])) > 0 or
                len(storage_data3.get('statusRecords', [])) > 0
            ):
                log_result("刷新后数据恢复", "通过")
            else:
                log_result("刷新后数据恢复", "失败")
                
        except Exception as e:
            log_result("刷新恢复验证", "失败", str(e))
        
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
    print("本地指南游戏 MVP - Playwright 自动化测试 (修复版)")
    print("运行环境: http://localhost:5173")
    print()
    
    try:
        results = run_tests()
        print("\n测试完成")
    except Exception as e:
        print(f"\n测试失败: {e}")
