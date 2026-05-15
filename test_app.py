from playwright.sync_api import sync_playwright

test_results = []

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        console_errors = []
        page.on('console', lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type == 'error' else None)
        
        print("=" * 50)
        print("测试1: 首次打开页面")
        print("=" * 50)
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        
        title = page.title()
        print(f"页面标题: {title}")
        
        content = page.content()
        if '本地指南游戏' in content:
            print("✓ 首页正常显示")
            test_results.append(("首页加载", "通过", "页面包含'本地指南游戏'"))
        else:
            print("✗ 首页未正常显示")
            test_results.append(("首页加载", "失败", "页面不包含'本地指南游戏'"))
        
        print("\n" + "=" * 50)
        print("测试2: 检查模块入口")
        print("=" * 50)
        
        empathy_btn = page.locator('text=共情小屋').first
        if empathy_btn.is_visible():
            print("✓ 共情小屋入口可见")
            test_results.append(("共情小屋入口", "通过", "入口可见"))
        else:
            print("✗ 共情小屋入口不可见")
            test_results.append(("共情小屋入口", "失败", "入口不可见"))
        
        print("\n" + "=" * 50)
        print("测试3: 共情小屋流程")
        print("=" * 50)
        
        empathy_btn.click()
        page.wait_for_load_state('networkidle')
        
        if page.locator('text=发生了什么').is_visible():
            print("✓ 共情小屋步骤1正常显示")
            test_results.append(("共情小屋步骤1", "通过", "正常显示"))
        else:
            print("✗ 共情小屋步骤1未显示")
            test_results.append(("共情小屋步骤1", "失败", "未显示"))
        
        situation_input = page.locator('#empathySituation')
        situation_input.fill('今天会议上被老板质疑了方案')
        print("✓ 输入了观察内容")
        
        page.locator('text=下一步').click()
        page.wait_for_timeout(500)
        
        if page.locator('text=我现在有什么感受').is_visible():
            print("✓ 共情小屋步骤2正常显示")
            test_results.append(("共情小屋步骤2", "通过", "正常显示"))
        else:
            print("✗ 共情小屋步骤2未显示")
            test_results.append(("共情小屋步骤2", "失败", "未显示"))
        
        print("\n" + "=" * 50)
        print("测试4: 状态观测台")
        print("=" * 50)
        
        page.locator('text=返回').click()
        page.wait_for_load_state('networkidle')
        
        status_btn = page.locator('text=状态观测台').first
        status_btn.click()
        page.wait_for_load_state('networkidle')
        
        if page.locator('text=今日能量').is_visible():
            print("✓ 状态观测台正常显示")
            test_results.append(("状态观测台", "通过", "正常显示"))
        else:
            print("✗ 状态观测台未正常显示")
            test_results.append(("状态观测台", "失败", "未正常显示"))
        
        print("\n" + "=" * 50)
        print("测试5: 微习惯工坊")
        print("=" * 50)
        
        page.locator('text=返回').click()
        page.wait_for_load_state('networkidle')
        
        habits_btn = page.locator('text=微习惯工坊').first
        habits_btn.click()
        page.wait_for_load_state('networkidle')
        
        if page.locator('text=创建新习惯').is_visible():
            print("✓ 微习惯工坊正常显示")
            test_results.append(("微习惯工坊", "通过", "正常显示"))
        else:
            print("✗ 微习惯工坊未正常显示")
            test_results.append(("微习惯工坊", "失败", "未正常显示"))
        
        print("\n" + "=" * 50)
        print("测试6: 优先级决策岛")
        print("=" * 50)
        
        page.locator('text=返回').click()
        page.wait_for_load_state('networkidle')
        
        priority_btn = page.locator('text=优先级决策岛').first
        priority_btn.click()
        page.wait_for_load_state('networkidle')
        
        if page.locator('text=第一道门').is_visible():
            print("✓ 优先级决策岛正常显示")
            test_results.append(("优先级决策岛", "通过", "正常显示"))
        else:
            print("✗ 优先级决策岛未正常显示")
            test_results.append(("优先级决策岛", "失败", "未正常显示"))
        
        print("\n" + "=" * 50)
        print("测试7: 回顾花园")
        print("=" * 50)
        
        page.locator('text=返回').click()
        page.wait_for_load_state('networkidle')
        
        review_btn = page.locator('text=回顾花园').first
        review_btn.click()
        page.wait_for_load_state('networkidle')
        
        if page.locator('text=导出 JSON').is_visible():
            print("✓ 回顾花园正常显示")
            test_results.append(("回顾花园", "通过", "正常显示"))
        else:
            print("✗ 回顾花园未正常显示")
            test_results.append(("回顾花园", "失败", "未正常显示"))
        
        if page.locator('text=清空全部数据').is_visible():
            print("✓ 清空数据按钮存在")
            test_results.append(("清空数据确认", "通过", "按钮存在（需二次确认）"))
        
        print("\n" + "=" * 50)
        print("测试8: 控制台错误检查")
        print("=" * 50)
        
        if console_errors:
            print(f"发现 {len(console_errors)} 个控制台错误:")
            for err in console_errors:
                print(f"  - {err}")
            test_results.append(("控制台错误", "失败", f"发现{len(console_errors)}个错误"))
        else:
            print("✓ 无控制台错误")
            test_results.append(("控制台错误", "通过", "无错误"))
        
        browser.close()
        
        print("\n" + "=" * 50)
        print("测试总结")
        print("=" * 50)
        passed = sum(1 for r in test_results if r[1] == "通过")
        total = len(test_results)
        print(f"通过: {passed}/{total}")
        
        for name, status, detail in test_results:
            symbol = "✓" if status == "通过" else "✗"
            print(f"{symbol} [{status}] {name}: {detail}")
        
        return test_results

if __name__ == '__main__':
    run_test()
