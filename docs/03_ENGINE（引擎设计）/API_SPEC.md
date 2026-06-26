# Physics Lab API 接口规范

## 文档信息

| 项目 | 内容 |
|------|------|
| 产品名称 | Physics Lab |
| 文档类型 | 前后端接口规范 |
| 版本 | v1.0 |
| 通信协议 | IPC (Electron) / JSON-RPC |
| 数据格式 | JSON |
| 最后更新 | 2026-06-24 |

---

## 1. 概述

### 1.1 架构说明

Physics Lab 采用 Electron 架构，前端（Renderer Process）与后端（Main Process）通过 IPC 通信。同时为未来云同步预留 HTTP RESTful 接口设计。

```
┌─────────────────────────────┐
│     Renderer Process        │
│     (React Frontend)        │
│                             │
│  Zustand Store              │
│       │                     │
│       ▼                     │
│  API Client Layer           │
│  (ipcRenderer.invoke)       │
└─────────────┬───────────────┘
              │ IPC Channel
┌─────────────▼───────────────┐
│     Main Process             │
│     (Node.js Backend)        │
│                              │
│  IPC Handler Layer           │
│       │                      │
│       ▼                      │
│  Service Layer               │
│  ├── ExerciseService         │
│  ├── AnalysisService         │
│  ├── ExperimentService       │
│  ├── ErrorBookService        │
│  ├── FavoriteService         │
│  ├── LearningService         │
│  ├── KnowledgeService        │
│  ├── UserService             │
│  └── AIService               │
│       │                      │
│       ▼                      │
│  Data Layer                  │
│  ├── PrismaClient            │
│  └── SQLite                  │
└──────────────────────────────┘
```

### 1.2 通用约定

#### 请求格式

```json
{
  "method": "namespace.action",
  "params": {},
  "id": "request-uuid"
}
```

#### 成功响应

```json
{
  "id": "request-uuid",
  "result": {},
  "timestamp": "2026-06-24T10:00:00Z"
}
```

#### 错误响应

```json
{
  "id": "request-uuid",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "timestamp": "2026-06-24T10:00:00Z"
}
```

#### 错误码体系

| 错误码 | HTTP等价 | 说明 |
|--------|----------|------|
| BAD_REQUEST | 400 | 请求参数错误 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突（如重复收藏） |
| AI_TIMEOUT | 408 | AI 解析超时 |
| AI_PARSE_FAILED | 422 | AI 无法解析题目 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| NOT_IMPLEMENTED | 501 | 功能未实现 |

#### 分页约定

```json
{
  "page": 1,
  "pageSize": 20,
  "total": 156,
  "totalPages": 8,
  "items": []
}
```

#### IPC 通道命名

所有 IPC 通道以 `physics-lab:` 为前缀，格式：`physics-lab:{domain}:{action}`

---

## 2. 题目模块 (Exercise)

### 2.1 创建题目

**IPC:** `physics-lab:exercise:create`

**请求：**
```json
{
  "method": "exercise.create",
  "params": {
    "inputType": "text | image | pdf",
    "rawText": "一质量为2kg的小球从10m高处自由落下...",
    "rawImagePath": "C:\\Users\\...\\problem.png",
    "rawPdfPath": null,
    "title": "自由落体运动",
    "subject": "mechanics",
    "difficulty": "easy",
    "grade": "senior_high",
    "source": "2024高考全国卷I"
  }
}
```

**响应：**
```json
{
  "result": {
    "id": "ex-abc123",
    "inputType": "text",
    "status": "pending",
    "createdAt": "2026-06-24T10:00:00Z"
  }
}
```

### 2.2 获取题目详情

**IPC:** `physics-lab:exercise:get`

**请求：**
```json
{
  "method": "exercise.get",
  "params": {
    "id": "ex-abc123"
  }
}
```

**响应：**
```json
{
  "result": {
    "id": "ex-abc123",
    "title": "自由落体运动",
    "rawText": "一质量为2kg的小球从10m高处自由落下...",
    "inputType": "text",
    "subject": "mechanics",
    "difficulty": "easy",
    "grade": "senior_high",
    "status": "parsed",
    "tags": [
      { "id": "tag-001", "name": "自由落体", "category": "topic", "color": "#4CAF50" }
    ],
    "analysis": {
      "id": "an-abc123",
      "aiMode": "detailed",
      "status": "completed",
      "confidenceScore": 0.92
    },
    "createdAt": "2026-06-24T10:00:00Z",
    "updatedAt": "2026-06-24T10:00:30Z"
  }
}
```

### 2.3 查询题目列表

**IPC:** `physics-lab:exercise:list`

**请求：**
```json
{
  "method": "exercise.list",
  "params": {
    "page": 1,
    "pageSize": 20,
    "filters": {
      "subject": "mechanics",
      "difficulty": "easy",
      "status": "parsed",
      "search": "自由落体",
      "grade": "senior_high",
      "dateFrom": "2026-01-01T00:00:00Z",
      "dateTo": "2026-06-24T23:59:59Z"
    },
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

**响应：**
```json
{
  "result": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3,
    "items": [
      {
        "id": "ex-abc123",
        "title": "自由落体运动",
        "subject": "mechanics",
        "difficulty": "easy",
        "status": "parsed",
        "createdAt": "2026-06-24T10:00:00Z"
      }
    ]
  }
}
```

### 2.4 更新题目

**IPC:** `physics-lab:exercise:update`

**请求：**
```json
{
  "method": "exercise.update",
  "params": {
    "id": "ex-abc123",
    "title": "修正后的标题",
    "difficulty": "medium",
    "tags": ["tag-001", "tag-002"]
  }
}
```

### 2.5 删除题目

**IPC:** `physics-lab:exercise:delete`

**请求：**
```json
{
  "method": "exercise.delete",
  "params": {
    "id": "ex-abc123"
  }
}
```

### 2.6 添加/移除标签

**IPC:** `physics-lab:exercise:addTag` / `physics-lab:exercise:removeTag`

**请求：**
```json
{
  "method": "exercise.addTag",
  "params": {
    "exerciseId": "ex-abc123",
    "tagId": "tag-001"
  }
}
```

---

## 3. 解析模块 (Analysis)

### 3.1 开始解析

**IPC:** `physics-lab:analysis:parse`

这是核心API，触发AI解析题目并生成PhysicsScene。解析过程支持进度推送。

**请求：**
```json
{
  "method": "analysis.parse",
  "params": {
    "exerciseId": "ex-abc123",
    "aiMode": "detailed",
    "aiModel": "qwen2.5:7b",
    "forceReParse": false
  }
}
```

**响应（解析完成后）：**
```json
{
  "result": {
    "id": "an-abc123",
    "exerciseId": "ex-abc123",
    "status": "completed",
    "aiMode": "detailed",
    "aiModel": "qwen2.5:7b",
    "parseDurationMs": 12500,
    "confidenceScore": 0.92,
    "tokenUsed": 3400,
    "createdAt": "2026-06-24T10:00:12Z"
  }
}
```

### 3.2 获取解析进度

**IPC:** `physics-lab:analysis:progress`

解析过程中实时推送进度。

**推送事件：**
```json
{
  "event": "analysis.progress",
  "data": {
    "exerciseId": "ex-abc123",
    "stage": "entity_extraction | environment_extraction | force_analysis | motion_analysis | timeline_generation | scene_assembly",
    "progress": 0.6,
    "message": "正在进行运动分析..."
  }
}
```

### 3.3 获取 PhysicsScene

**IPC:** `physics-lab:analysis:getScene`

**请求：**
```json
{
  "method": "analysis.getScene",
  "params": {
    "exerciseId": "ex-abc123"
  }
}
```

**响应：**
```json
{
  "result": {
    "analysisId": "an-abc123",
    "exerciseId": "ex-abc123",
    "physicsScene": {
      "entities": [],
      "environment": [],
      "forces": [],
      "constraints": [],
      "equations": [],
      "timeline": [],
      "camera_script": [],
      "ui_controls": [],
      "knowledge_tags": []
    },
    "confidenceScore": 0.92,
    "createdAt": "2026-06-24T10:00:12Z"
  }
}
```

### 3.4 获取AI模式列表

**IPC:** `physics-lab:analysis:getModes`

**响应：**
```json
{
  "result": {
    "modes": [
      {
        "id": "quick",
        "name": "快速解题",
        "description": "直接输出解题步骤和答案",
        "estimatedTimeMs": 5000,
        "available": true
      },
      {
        "id": "detailed",
        "name": "详细解析",
        "description": "逐步受力分析、运动分析、能量分析",
        "estimatedTimeMs": 15000,
        "available": true
      },
      {
        "id": "teacher",
        "name": "AI教师",
        "description": "对话式引导教学",
        "estimatedTimeMs": 30000,
        "available": false
      },
      {
        "id": "socratic",
        "name": "苏格拉底教学",
        "description": "纯提问式引导",
        "estimatedTimeMs": 30000,
        "available": false
      }
    ]
  }
}
```

---

## 4. 实验模块 (Experiment)

### 4.1 创建实验记录

**IPC:** `physics-lab:experiment:create`

**请求：**
```json
{
  "method": "experiment.create",
  "params": {
    "analysisId": "an-abc123",
    "params": {
      "mass": 5.0,
      "velocity": 10.0,
      "angle": 45.0,
      "friction": 0.2
    }
  }
}
```

### 4.2 查询实验记录

**IPC:** `physics-lab:experiment:list`

**请求：**
```json
{
  "method": "experiment.list",
  "params": {
    "analysisId": "an-abc123",
    "page": 1,
    "pageSize": 20
  }
}
```

### 4.3 保存实验状态

**IPC:** `physics-lab:experiment:saveState`

保存当前实验的完整状态（参数、视角、时间点），便于恢复。

**请求：**
```json
{
  "method": "experiment.saveState",
  "params": {
    "analysisId": "an-abc123",
    "state": {
      "params": {
        "mass": 5.0,
        "velocity": 10.0
      },
      "camera": {
        "position": [10, 5, 10],
        "target": [0, 0, 0],
        "zoom": 1.5
      },
      "timePoint": 3.5,
      "paused": false
    }
  }
}
```

---

## 5. 错题本模块 (ErrorBook)

### 5.1 添加错题

**IPC:** `physics-lab:errorbook:add`

**请求：**
```json
{
  "method": "errorbook.add",
  "params": {
    "exerciseId": "ex-abc123",
    "errorType": "concept",
    "userAnswer": "20m/s",
    "notes": "忘记考虑空气阻力"
  }
}
```

### 5.2 查询错题列表

**IPC:** `physics-lab:errorbook:list`

**请求：**
```json
{
  "method": "errorbook.list",
  "params": {
    "page": 1,
    "pageSize": 20,
    "filters": {
      "subject": "mechanics",
      "errorType": "concept",
      "mastered": false,
      "dueForReview": true
    },
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

### 5.3 标记复习

**IPC:** `physics-lab:errorbook:review`

**请求：**
```json
{
  "method": "errorbook.review",
  "params": {
    "id": "eb-abc123",
    "mastered": false,
    "reviewQuality": 3
  }
}
```

`reviewQuality` 按间隔重复算法分级（0=完全遗忘, 5=完全掌握）。

### 5.4 删除错题

**IPC:** `physics-lab:errorbook:remove`

---

## 6. 收藏模块 (Favorite)

### 6.1 添加收藏

**IPC:** `physics-lab:favorite:add`

**请求：**
```json
{
  "method": "favorite.add",
  "params": {
    "exerciseId": "ex-abc123",
    "folderId": "fd-abc123",
    "note": "典型的自由落体变形题"
  }
}
```

### 6.2 查询收藏列表

**IPC:** `physics-lab:favorite:list`

**请求：**
```json
{
  "method": "favorite.list",
  "params": {
    "folderId": "fd-abc123",
    "page": 1,
    "pageSize": 20
  }
}
```

### 6.3 管理文件夹

**IPC:** `physics-lab:favorite:createFolder`

**请求：**
```json
{
  "method": "favorite.createFolder",
  "params": {
    "name": "力学经典题",
    "color": "#4CAF50",
    "icon": "folder-physics"
  }
}
```

**IPC:** `physics-lab:favorite:updateFolder`
**IPC:** `physics-lab:favorite:deleteFolder`
**IPC:** `physics-lab:favorite:listFolders`
**IPC:** `physics-lab:favorite:remove`

---

## 7. 学习记录模块 (Learning)

### 7.1 记录学习行为

**IPC:** `physics-lab:learning:record`

**请求：**
```json
{
  "method": "learning.record",
  "params": {
    "exerciseId": "ex-abc123",
    "actionType": "experiment",
    "durationMs": 120000,
    "metadata": {
      "paramsAdjusted": true,
      "viewsRotated": 15,
      "chartsViewed": ["v-t", "s-t"]
    }
  }
}
```

### 7.2 学习统计

**IPC:** `physics-lab:learning:stats`

**请求：**
```json
{
  "method": "learning.stats",
  "params": {
    "period": "week | month | all",
    "dateFrom": "2026-06-17T00:00:00Z",
    "dateTo": "2026-06-24T23:59:59Z"
  }
}
```

**响应：**
```json
{
  "result": {
    "totalExercises": 45,
    "totalExperiments": 120,
    "totalDurationMs": 3600000,
    "bySubject": {
      "mechanics": 30,
      "electromagnetism": 15
    },
    "dailyActivity": [
      { "date": "2026-06-23", "count": 8, "durationMs": 600000 },
      { "date": "2026-06-24", "count": 5, "durationMs": 300000 }
    ],
    "streakDays": 7
  }
}
```

---

## 8. 知识图谱模块 (Knowledge)

### 8.1 获取知识图谱

**IPC:** `physics-lab:knowledge:graph`

**请求：**
```json
{
  "method": "knowledge.graph",
  "params": {
    "exerciseId": "ex-abc123",
    "depth": 2
  }
}
```

**响应：**
```json
{
  "result": {
    "nodes": [
      {
        "id": "kp-001",
        "name": "牛顿第二定律",
        "category": "mechanics",
        "level": 2,
        "isRelated": true,
        "mastery": 0.75
      },
      {
        "id": "kp-002",
        "name": "自由落体运动",
        "category": "mechanics",
        "level": 3,
        "isRelated": true,
        "mastery": 0.60
      }
    ],
    "edges": [
      {
        "sourceId": "kp-001",
        "targetId": "kp-002",
        "relationType": "prerequisite",
        "weight": 0.9
      }
    ]
  }
}
```

### 8.2 搜索知识点

**IPC:** `physics-lab:knowledge:search`

**请求：**
```json
{
  "method": "knowledge.search",
  "params": {
    "query": "牛顿定律",
    "category": "mechanics",
    "limit": 10
  }
}
```

### 8.3 刷新知识图谱缓存

**IPC:** `physics-lab:knowledge:refresh`

触发重新计算用户对每个知识点的掌握程度。

---

## 9. 用户模块 (User/Settings)

### 9.1 获取设置

**IPC:** `physics-lab:settings:get`

**响应：**
```json
{
  "result": {
    "theme": "system",
    "language": "zh-CN",
    "autoPlay": true,
    "qualityLevel": "auto",
    "fontSize": 14,
    "showGrid": true,
    "showAxes": true,
    "physicsEngineFPS": 60
  }
}
```

### 9.2 更新设置

**IPC:** `physics-lab:settings:update`

**请求：**
```json
{
  "method": "settings.update",
  "params": {
    "theme": "dark",
    "qualityLevel": "high"
  }
}
```

### 9.3 重置设置

**IPC:** `physics-lab:settings:reset`

---

## 10. AI 服务模块 (AI Service)

### 10.1 检测本地AI状态

**IPC:** `physics-lab:ai:status`

**响应：**
```json
{
  "result": {
    "ollamaRunning": true,
    "availableModels": [
      {
        "name": "qwen2.5:7b",
        "size": "4.7GB",
        "status": "ready",
        "capabilities": ["text", "physics-analysis"]
      },
      {
        "name": "deepseek-r1:8b",
        "size": "4.9GB",
        "status": "not_downloaded",
        "capabilities": ["text", "physics-analysis", "reasoning"]
      }
    ],
    "defaultModel": "qwen2.5:7b",
    "embeddingModel": "nomic-embed-text"
  }
}
```

### 10.2 下载模型

**IPC:** `physics-lab:ai:downloadModel`

**请求：**
```json
{
  "method": "ai.downloadModel",
  "params": {
    "modelName": "deepseek-r1:8b"
  }
}
```

**推送事件：**
```json
{
  "event": "ai.downloadProgress",
  "data": {
    "modelName": "deepseek-r1:8b",
    "progress": 0.45,
    "downloadedBytes": 2200000000,
    "totalBytes": 4900000000,
    "speedBytesPerSec": 5000000
  }
}
```

### 10.3 聊天式AI问答

**IPC:** `physics-lab:ai:chat`

用于 AI 教师模式和苏格拉底模式的对话。

**请求：**
```json
{
  "method": "ai.chat",
  "params": {
    "conversationId": "conv-abc123",
    "message": "为什么小球在最高点速度为零？",
    "context": {
      "exerciseId": "ex-abc123",
      "aiMode": "teacher"
    },
    "history": [
      { "role": "user", "content": "我不理解这个运动过程" },
      { "role": "assistant", "content": "让我们一步一步来分析..." }
    ]
  }
}
```

**响应：**
```json
{
  "result": {
    "conversationId": "conv-abc123",
    "message": "很好的问题！小球在最高点速度为零是因为...",
    "tokenUsed": 250
  }
}
```

---

## 11. 数据管理模块 (Data)

### 11.1 导出数据

**IPC:** `physics-lab:data:export`

**请求：**
```json
{
  "method": "data.export",
  "params": {
    "format": "json | pdf | csv",
    "scope": "all | exercises | errorbook | favorites",
    "filters": {
      "subject": "mechanics",
      "dateFrom": "2026-01-01T00:00:00Z"
    }
  }
}
```

**响应：**
```json
{
  "result": {
    "filePath": "C:\\Users\\...\\PhysicsLab_Export_20260624.json",
    "fileSizeBytes": 2048000,
    "itemCount": 150
  }
}
```

### 11.2 导入数据

**IPC:** `physics-lab:data:import`

### 11.3 备份数据库

**IPC:** `physics-lab:data:backup`

### 11.4 恢复数据库

**IPC:** `physics-lab:data:restore`

---

## 12. OCR 模块

### 12.1 OCR 识别

**IPC:** `physics-lab:ocr:recognize`

**请求：**
```json
{
  "method": "ocr.recognize",
  "params": {
    "imagePath": "C:\\Users\\...\\problem.png",
    "language": "zh-CN"
  }
}
```

**响应：**
```json
{
  "result": {
    "text": "一质量为2kg的小球从10m高处自由落下，求落地时的速度。（g=10m/s²）",
    "confidence": 0.95,
    "regions": [
      {
        "bbox": [10, 20, 300, 80],
        "text": "一质量为2kg的小球...",
        "type": "text"
      }
    ]
  }
}
```

---

## 13. 云同步模块 (Phase 5)

### 13.1 触发同步

**IPC:** `physics-lab:sync:start`

**请求：**
```json
{
  "method": "sync.start",
  "params": {
    "scope": "all | exercises | errorbook | favorites | settings"
  }
}
```

**推送事件：**
```json
{
  "event": "sync.progress",
  "data": {
    "stage": "upload | download | merge",
    "progress": 0.75,
    "totalItems": 120,
    "processedItems": 90
  }
}
```

### 13.2 同步状态

**IPC:** `physics-lab:sync:status`

### 13.3 解决冲突

**IPC:** `physics-lab:sync:resolveConflict`

**请求：**
```json
{
  "method": "sync.resolveConflict",
  "params": {
    "entityType": "exercise",
    "entityId": "ex-abc123",
    "resolution": "local | remote | merge",
    "mergedData": {}
  }
}
```

---

## 14. IPC 事件推送

### 14.1 通用事件格式

```json
{
  "event": "namespace.action",
  "data": {},
  "timestamp": "2026-06-24T10:00:00Z"
}
```

### 14.2 事件列表

| 事件 | 触发时机 | 推送数据 |
|------|----------|----------|
| `analysis.progress` | AI解析进度更新 | exerciseId, stage, progress |
| `analysis.completed` | 解析完成 | exerciseId, analysisId |
| `analysis.failed` | 解析失败 | exerciseId, error |
| `ai.downloadProgress` | AI模型下载进度 | modelName, progress |
| `sync.progress` | 云同步进度 | stage, progress |
| `sync.conflict` | 同步冲突 | entityType, entityId |
| `app.update` | 应用更新通知 | version, downloadUrl |

---

## 15. 自定义 IPC 通道索引

| 通道 | 方法 | 说明 |
|------|------|------|
| `physics-lab:exercise:create` | exercise.create | 创建题目 |
| `physics-lab:exercise:get` | exercise.get | 获取题目详情 |
| `physics-lab:exercise:list` | exercise.list | 查询题目列表 |
| `physics-lab:exercise:update` | exercise.update | 更新题目 |
| `physics-lab:exercise:delete` | exercise.delete | 删除题目 |
| `physics-lab:exercise:addTag` | exercise.addTag | 添加标签 |
| `physics-lab:exercise:removeTag` | exercise.removeTag | 移除标签 |
| `physics-lab:analysis:parse` | analysis.parse | 开始AI解析 |
| `physics-lab:analysis:getScene` | analysis.getScene | 获取PhysicsScene |
| `physics-lab:analysis:getModes` | analysis.getModes | 获取AI模式列表 |
| `physics-lab:analysis:reParse` | analysis.reParse | 重新解析 |
| `physics-lab:experiment:create` | experiment.create | 创建实验记录 |
| `physics-lab:experiment:list` | experiment.list | 查询实验记录 |
| `physics-lab:experiment:saveState` | experiment.saveState | 保存实验状态 |
| `physics-lab:errorbook:add` | errorbook.add | 添加错题 |
| `physics-lab:errorbook:list` | errorbook.list | 查询错题列表 |
| `physics-lab:errorbook:review` | errorbook.review | 标记复习 |
| `physics-lab:errorbook:remove` | errorbook.remove | 删除错题 |
| `physics-lab:errorbook:stats` | errorbook.stats | 错题统计 |
| `physics-lab:favorite:add` | favorite.add | 添加收藏 |
| `physics-lab:favorite:list` | favorite.list | 查询收藏列表 |
| `physics-lab:favorite:remove` | favorite.remove | 取消收藏 |
| `physics-lab:favorite:createFolder` | favorite.createFolder | 创建收藏夹 |
| `physics-lab:favorite:deleteFolder` | favorite.deleteFolder | 删除收藏夹 |
| `physics-lab:favorite:listFolders` | favorite.listFolders | 查询收藏夹列表 |
| `physics-lab:learning:record` | learning.record | 记录学习行为 |
| `physics-lab:learning:stats` | learning.stats | 学习统计 |
| `physics-lab:learning:history` | learning.history | 学习历史 |
| `physics-lab:knowledge:graph` | knowledge.graph | 获取知识图谱 |
| `physics-lab:knowledge:search` | knowledge.search | 搜索知识点 |
| `physics-lab:knowledge:refresh` | knowledge.refresh | 刷新图谱缓存 |
| `physics-lab:settings:get` | settings.get | 获取设置 |
| `physics-lab:settings:update` | settings.update | 更新设置 |
| `physics-lab:settings:reset` | settings.reset | 重置设置 |
| `physics-lab:ai:status` | ai.status | 检测AI状态 |
| `physics-lab:ai:downloadModel` | ai.downloadModel | 下载AI模型 |
| `physics-lab:ai:chat` | ai.chat | AI对话 |
| `physics-lab:ocr:recognize` | ocr.recognize | OCR识别 |
| `physics-lab:data:export` | data.export | 导出数据 |
| `physics-lab:data:import` | data.import | 导入数据 |
| `physics-lab:data:backup` | data.backup | 备份数据库 |
| `physics-lab:data:restore` | data.restore | 恢复数据库 |
| `physics-lab:sync:start` | sync.start | 触发同步 |
| `physics-lab:sync:status` | sync.status | 同步状态 |
| `physics-lab:sync:resolveConflict` | sync.resolveConflict | 解决冲突 |

---

## 16. 版本兼容

| API版本 | 最低客户端版本 | 说明 |
|---------|---------------|------|
| v1 | 1.0.0 | MVP版本，所有核心接口 |
| v2 | TBD | 新增云同步、AI教师、知识图谱 |

所有请求可携带 `"apiVersion": "v1"` 用于版本协商。默认使用最新版本。

---

## 17. 附录

### 17.1 参考文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 技术架构
- [PRD.md](./PRD.md) - 产品需求文档
- [DATABASE.md](./DATABASE.md) - 数据库设计文档
- [PHYSICSSCENE_SCHEMA.md](./PHYSICSSCENE_SCHEMA.md) - PhysicsScene Schema

### 17.2 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-06-24 | 初始版本，覆盖全部MVP接口 | Physics Lab 架构组 |
