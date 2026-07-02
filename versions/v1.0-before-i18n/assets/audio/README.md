# 本地指南游戏 - 原创BGM占位素材

## 概述

这些音频文件是本地指南游戏的原创占位BGM素材，用于原型开发和测试。

## 重要声明

- **原创素材**：所有音频均为本项目脚本生成的原创内容
- **非商业用途**：仅作为占位原型素材，不声称是专业音乐作品
- **无授权问题**：不包含任何第三方版权音乐或改编内容
- **允许使用**：可自由用于本项目的开发和测试

## 音频文件

| 文件名 | 用途 | 风格 |
|--------|------|------|
| cloud_harbor_theme.wav | 首页/云港入口 | 明亮、轻盈、清晨海面 |
| empathy_room_loop.wav | 共情小屋 | 安静、舒缓、低刺激 |
| review_garden_loop.wav | 回顾花园 | 温暖、放松、成就感 |

## 技术参数

- 采样率：44100 Hz
- 位深：16-bit
- 声道：单声道
- 格式：WAV
- 时长：30秒（可循环）

## 生成方式

使用项目中的 `scripts/generate_bgm.py` 脚本生成。

```bash
# 生成所有音轨
python scripts/generate_bgm.py all

# 生成单个音轨
python scripts/generate_bgm.py cloud_harbor
python scripts/generate_bgm.py empathy_room
python scripts/generate_bgm.py review_garden
```

## 播放策略

- **默认不自动播放**：尊重用户体验和浏览器策略
- **必须用户点击**：用户主动点击"开启声音"后才播放
- **默认音量**：0.15-0.25（较低音量）
- **失败容错**：音频加载失败不影响核心功能

## 相关文件

- `js/audioController.js` - 音频控制器
- `scripts/generate_bgm.py` - BGM生成脚本
