#!/usr/bin/env python3
"""
本地指南游戏 - 原创占位BGM生成脚本
生成轻量、治愈系、可循环的占位BGM

使用方法:
  python scripts/generate_bgm.py [track_name]

参数:
  track_name: 可选，要生成的音轨名称
    - cloud_harbor: 云港主题（明亮、轻盈）
    - empathy_room: 共情小屋（安静、舒缓）
    - review_garden: 回顾花园（温暖、放松）
    - all: 生成所有音轨（默认）

示例:
  python scripts/generate_bgm.py all
  python scripts/generate_bgm.py cloud_harbor
"""

import wave
import struct
import math
import os
import sys

SAMPLE_RATE = 44100
DURATION = 30

OUTPUT_DIR = 'assets/audio'

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def generate_sine(freq, duration, sample_rate=SAMPLE_RATE):
    n_samples = int(sample_rate * duration)
    return [math.sin(2 * math.pi * freq * t / sample_rate) for t in range(n_samples)]

def generate_tone(freq, duration, sample_rate=SAMPLE_RATE, envelope=True, gain=1.0):
    n_samples = int(sample_rate * duration)
    samples = []
    for t in range(n_samples):
        val = math.sin(2 * math.pi * freq * t / sample_rate)
        if envelope:
            attack = int(sample_rate * 0.1)
            release = int(sample_rate * 0.3)
            if t < attack:
                val *= t / attack
            elif t > n_samples - release:
                val *= (n_samples - t) / release
        val *= gain
        samples.append(val)
    return samples

def mix_samples(samples_list, volumes=None):
    if volumes is None:
        volumes = [1.0 / len(samples_list)] * len(samples_list)
    
    max_len = max(len(s) for s in samples_list)
    result = []
    for i in range(max_len):
        val = 0
        for j, samples in enumerate(samples_list):
            if i < len(samples):
                val += samples[i] * volumes[j]
        val = max(-1, min(1, val))
        result.append(val)
    return result

def samples_to_bytes(samples, gain=0.3):
    return b''.join(struct.pack('<h', int(s * 32767 * gain)) for s in samples)

def write_wav(filename, samples, sample_rate=SAMPLE_RATE):
    ensure_dir(os.path.dirname(filename))
    with wave.open(filename, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(samples_to_bytes(samples))

def generate_cloud_harbor():
    """
    云港主题：明亮、轻盈、清晨海面
    - 基音：C大调主和弦
    - 高音区轻柔泛音
    - 模拟海浪的缓慢波动
    """
    samples_list = []
    
    c_freq = 261.63
    e_freq = 329.63
    g_freq = 392.00
    c2_freq = 523.25
    
    for freq, vol in [(c_freq, 0.4), (e_freq, 0.3), (g_freq, 0.25), (c2_freq, 0.15)]:
        tone = generate_tone(freq, DURATION)
        samples_list.append(tone)
    
    wave_tone = generate_tone(0.5, DURATION)
    wave_effect = [s * 0.1 * (1 + math.sin(2 * math.pi * 0.1 * t / SAMPLE_RATE)) 
                   for t, s in enumerate(wave_tone[:len(samples_list[0])])]
    
    samples_list.append(wave_effect * (len(samples_list[0]) // len(wave_effect) + 1))
    
    result = mix_samples(samples_list, [0.25, 0.2, 0.18, 0.12, 0.08])
    
    output_path = os.path.join(OUTPUT_DIR, 'cloud_harbor_theme.wav')
    write_wav(output_path, result)
    print(f"✓ 生成: {output_path}")

def generate_empathy_room():
    """
    共情小屋：安静、舒缓、低刺激
    - 低沉的大提琴式长音
    - 极简的和声
    - 无尖锐频率
    """
    samples_list = []
    
    a_freq = 220.00
    e_freq = 329.63
    f_freq = 349.23
    
    for freq, vol in [(a_freq, 0.5), (e_freq, 0.25), (f_freq, 0.2)]:
        tone = generate_tone(freq, DURATION)
        samples_list.append(tone)
    
    result = mix_samples(samples_list, [0.35, 0.2, 0.15])
    
    output_path = os.path.join(OUTPUT_DIR, 'empathy_room_loop.wav')
    write_wav(output_path, result)
    print(f"✓ 生成: {output_path}")

def generate_review_garden():
    """
    回顾花园：温暖、放松、有完成感
    - G大调明亮和弦
    - 轻微的上行旋律线条
    - 平和的节奏感
    """
    samples_list = []
    
    g_freq = 392.00
    b_freq = 493.88
    d_freq = 587.33
    g2_freq = 783.99
    
    chord_tones = [(g_freq, 0.4), (b_freq, 0.3), (d_freq, 0.25), (g2_freq, 0.1)]
    for freq, vol in chord_tones:
        tone = generate_tone(freq, DURATION)
        samples_list.append(tone)
    
    melody = []
    melody_notes = [
        (g_freq, 2), (b_freq, 1), (d_freq, 1), (g2_freq, 2),
        (d_freq, 1), (b_freq, 1), (g_freq, 2)
    ]
    note_time = 0
    for freq, duration in melody_notes:
        note_samples = generate_tone(freq, duration, gain=0.15)
        melody.extend(note_samples)
        note_time += duration
    
    while len(melody) < len(samples_list[0]):
        melody.append(0)
    
    samples_list.append(melody[:len(samples_list[0])])
    
    result = mix_samples(samples_list, [0.25, 0.2, 0.18, 0.08, 0.1])
    
    output_path = os.path.join(OUTPUT_DIR, 'review_garden_loop.wav')
    write_wav(output_path, result)
    print(f"✓ 生成: {output_path}")

def main():
    tracks = {
        'cloud_harbor': generate_cloud_harbor,
        'empathy_room': generate_empathy_room,
        'review_garden': generate_review_garden,
        'all': lambda: [generate_cloud_harbor(), generate_empathy_room(), generate_review_garden()]
    }
    
    track_name = sys.argv[1] if len(sys.argv) > 1 else 'all'
    
    if track_name not in tracks:
        print(f"错误: 未知音轨 '{track_name}'")
        print(f"可用音轨: {', '.join(tracks.keys())}")
        sys.exit(1)
    
    print(f"正在生成BGM音轨: {track_name}")
    print(f"采样率: {SAMPLE_RATE} Hz, 时长: {DURATION} 秒")
    print("-" * 40)
    
    tracks[track_name]()
    
    print("-" * 40)
    print("BGM生成完成!")
    print(f"输出目录: {OUTPUT_DIR}")
    print("注意: 这些是原创占位素材，不是专业音乐作品。")

if __name__ == '__main__':
    main()
