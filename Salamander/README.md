# 🚀 沙羅曼蛇 (Salamander / Life Force) - 街機網頁版

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-Canvas%202D-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/JavaScript-ES6%2B%20Modules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Web%20Audio%20API-Procedural%20Synth-9cf?style=for-the-badge" alt="Web Audio API">
  <img src="https://img.shields.io/badge/Dependencies-ZERO-brightgreen?style=for-the-badge" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
</p>

<p align="center">
  復刻 1986 年 Konami 傳奇射擊名作<strong>《沙羅曼蛇》（Salamander / Life Force）</strong>的純網頁版！<br>
  無任何第三方資源依賴（音效、音樂與像素美術全由程式碼即時合成與渲染），支援電腦鍵盤與手機/平板觸控，隨開即玩。
</p>

---

## ✨ 遊戲特色 (Features)

### 1. 雙經典戰機自由選用
- **1P: Vic Viper（藍白超時空巡航機）**：經典雙叉前掠翼、藍白相間塗裝與青藍色脈衝尾焰。
- **2P: Lord British（滅絕紅色戰機）**：專屬猩紅塗裝與灼熱尾焰。
- 在標題畫面按 `左右箭頭` 或 `A / D` 即可切換。

### 2. 忠實還原的動力膠囊與武裝系統
消滅整隊紅色巡航兵即可掉落經典動力膠囊：
- **`[S]` Speed Up**：升級戰機引擎航速（最高 5 階）。
- **`[M]` Missile**：投擲貼地 / 貼頂前進的巡航破壞飛彈。
- **`[R]` Ripple Laser**：同心擴散環形光波，光環隨飛行逐漸擴大，清怪涵蓋範圍極廣。
- **`[L]` Beam Laser**：高穿透光束雷射，瞬間貫穿沿線敵陣。
- **`[O]` Option（幽靈子機）**：最多可裝備 **4 台**！依序精準沿著戰機歷史飛行軌跡延遲跟隨，完全無敵並 100% 同步發射所有主武器與飛彈。
- **`[F]` Force Field（力場護盾）**：在機首前方產生偏轉防護力場，吸收多次直接攻擊傷害。

### 3. 兩大經典關卡與首領戰
- **Stage 1: 生體腔室 (Bio-Organic Cavern)**
  - 穿梭於蠕動的有機生體肉壁、吞噬細胞群與天花板眼球砲台。
  - **首領 Golen（戈倫 / 腦核巨眼怪）**：揮舞兩條巨大觸手抵擋攻勢，中央眼瞼定時閉合（刀槍不入彈開所有砲火），張開時露出脆弱瞳孔弱點並釋放致命的散射生體飛針！
- **Stage 2: 灼熱日珥 (Solar Prominence)**
  - 太陽高熱日珥噴發、高速掠過的火蝙蝠與火球巡航編隊。
  - **首領 Intruder（火龍）**：由龍頭與 14 節燃燒火球組成的巨型長龍，利用逆向運動學（Inverse Kinematics）在太空中蜿蜒穿梭；低於 35% 生命值時進入白熱狂暴模式，飛行速度暴增 40%！

### 4. 純 Web Audio API 程式化合成音樂與音效
- **Chiptune FM 晶片音樂序列器**：
  - 標題主題曲（神秘雄壯的星際序曲）
  - 第 1 關 BGM（熱血疾速經典 "Power of Anger" 風格多聲道合成）
  - 首領戰 BGM（急促且具壓迫感的戰鬥主題）
  - 第 2 關 BGM（烈焰奔馳節奏）
  - 過關勝利曲（Stage Clear Fanfare）
- **街機音效庫**：雙聯發機砲、Ripple 音波、光束嘯叫、重低音爆炸、警報警笛（Warning Siren）、護盾受擊等。

### 5. 街機沉浸體驗
- **CRT 掃描線濾鏡**：自帶復古電視掃描線與暗角光影效果（可隨時一鍵切換）。
- **完整 HUD 儀表板**：顯示 1UP 分數、最高分 (HI-SCORE)、剩餘戰機數 (REST)、動力裝備燈號與 Boss 血條。
- **高分保存**：自動利用瀏覽器 `localStorage` 紀錄你的最高分。

---

## 🕹️ 操作說明 (Controls)

### 鍵盤操作（桌機 / 筆電）

| 按鍵 | 功能說明 |
| :--- | :--- |
| **`W` `A` `S` `D`** 或 **`↑` `↓` `←` `→`** | 戰機 8 方向飛行移動（選單中切換戰機） |
| **`J`** / **`空白鍵`** / **`Z`** | 主武器發射（在標題畫面按下即開始遊戲） |
| **`K`** / **`X`** | 發射巡航飛彈 |
| **`C`** / **`M`** | **自動連發開關（Auto-Fire）** |
| **`P`** / **`ESC`** | 遊戲暫停 / 繼續 |
| **工具列按鈕** | 🔊 音效開關、📺 CRT 濾鏡切換、⛶ 全螢幕切換 |

### 觸控操作（行動裝置 / 平板）
- **左下方**：虛擬類比搖桿，按住滑動即可 360 度精確導航飛行。
- **右下方**：
  - **`FIRE`**：發射武器 / 開始遊戲。
  - **`AUTO`**：開啟 / 關閉自動連射。

---

## 🌟 經典彩蛋：Konami 秘技 (Konami Code)

向最偉大的遊戲秘技致敬！在遊戲中隨時輸入經典指令：

$$\uparrow\ \uparrow\ \downarrow\ \downarrow\ \leftarrow\ \rightarrow\ \leftarrow\ \rightarrow\ \text{B}\ \text{A}$$

```text
[上] [上] [下] [下] [左] [右] [左] [右] [B] [A]
```

- **效果**：立即解鎖 **30 條生命** 並配備 **全套滿裝神裝**（Beam Laser、Missile、4 台 Option 子機、Force Field 護盾）！

---

## 🚀 如何執行 (How to Run)

因為遊戲採用現代 JavaScript 模組系統 (`import / export`)，需要透過靜態網頁伺服器執行以避免瀏覽器本地檔案 CORS 限制。

### 方法 1：使用 Python（推薦，最簡單）
macOS 與大多數 Linux 系統均內建 Python：

```bash
# 進入專案目錄
cd Salamander

# 啟動 HTTP 伺服器
python3 -m http.server 8080
```
開啟瀏覽器訪問：**[http://localhost:8080](http://localhost:8080)**

---

### 方法 2：使用 Node.js / npx
若你有安裝 Node.js：

```bash
# 使用 npx serve 啟動
npx serve .
```

---

### 方法 3：使用 VS Code Live Server 擴充套件
1. 在 VS Code 中開啟專案資料夾。
2. 在 `index.html` 檔案上點擊滑鼠右鍵。
3. 選擇 **「Open with Live Server」** 即可自動開啟瀏覽器遊玩。

---

### 方法 4：部署至 GitHub Pages（線上隨點隨玩）
本專案為純靜態網頁架構，支援 GitHub Pages 免費託管：
1. 將專案推送到您的 GitHub 倉庫。
2. 進入倉庫的 **Settings** -> **Pages**。
3. 在 **Branch** 選擇 `main`（或 `master`），目錄選擇 `/ (root)`，點擊 **Save**。
4. 稍等 1 分鐘，即可透過 `https://<您的帳號>.github.io/<倉庫名稱>/` 在全球任何設備上遊玩！

---

## 📁 專案檔案結構 (Project Structure)

```text
Salamander/
├── index.html            # 遊戲主入口頁面、畫布與控制介面
├── README.md             # 專案說明文件
├── css/
│   └── style.css         # 街機復古風格、響應式畫布與觸控樣式
└── js/
    ├── audio/
    │   ├── soundEffects.js # Web Audio 8-bit 合成音效
    │   └── chiptuneBgm.js  # 多聲道 Chiptune 背景音樂序列器
    ├── core/
    │   ├── input.js        # 鍵盤、觸控搖桿與 Konami 秘技監聽
    │   ├── collision.js    # 圓形、AABB 與光束線段碰撞偵測
    │   └── game.js         # 遊戲主循環、狀態機與邏輯控制器
    ├── entities/
    │   ├── player.js       # 玩家戰機（Vic Viper / Lord British）
    │   ├── option.js       # 傳奇 Option 子機（座標歷史隊列跟隨）
    │   ├── weapons.js      # 普通砲、Ripple 光圈、穿透雷射、巡航飛彈
    │   ├── powerups.js     # 動力膠囊道具（S, M, R, L, O, F）
    │   ├── enemies.js      # 編隊巡航機、分裂細胞、眼球砲台、火蝙蝠
    │   └── bosses.js       # 首領 Golen（大腦眼怪）與 Intruder（火龍）
    ├── stages/
    │   ├── stage1.js       # 第 1 關生體地貌與波次腳本
    │   └── stage2.js       # 第 2 關太陽日珥與波次腳本
    └── render/
        ├── renderer.js     # 視差星空、HUD、Boss 警告標語、CRT 掃描線
        └── particles.js    # 引擎噴焰、爆炸碎塊、防護罩波浪粒子
```

---

## 📜 授權條款 (License)

本專案基於 [MIT License](LICENSE) 條款開源發布。遊戲靈感來自 Konami 經典街機遊戲《Salamander》（沙羅曼蛇）。
