# Physics Lab 数据库设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 产品名称 | Physics Lab |
| 文档类型 | 数据库设计文档 |
| 版本 | v1.0 |
| 数据库 | SQLite (via Prisma ORM) |
| 最后更新 | 2026-06-24 |

---

## 1. 设计原则

### 1.1 核心原则

- **离线优先**：所有数据存储在本地 SQLite，无需网络即可完整运行
- **单用户单库**：每个用户拥有独立的数据库文件，天然隔离
- **PhysicsScene 为核心**：所有解析、实验、动画数据均围绕 PhysicsScene 组织
- **不可变审计**：关键操作日志以追加模式存储，不修改历史记录
- **可迁移性**：数据库文件可直接备份、迁移、同步

### 1.2 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 数据库引擎 | SQLite 3.40+ | 零配置、嵌入式、跨平台、适合离线桌面应用 |
| ORM | Prisma | 类型安全、迁移管理、IDE友好 |
| 加密 | SQLCipher (可选) | 用户数据本地加密 |
| 全文搜索 | FTS5 | 题目、知识点文本搜索 |

---

## 2. ER图

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Settings     │       │   SyncState     │
│─────────────────│       │─────────────────│       │─────────────────│
│ id (PK)         │──1:1──│ userId (FK)     │       │ id (PK)         │
│ username        │       │ theme           │       │ entityType      │
│ displayName     │       │ language        │       │ entityId        │
│ avatarPath      │       │ autoPlay        │       │ localVersion    │
│ createdAt       │       │ qualityLevel    │       │ remoteVersion   │
│ updatedAt       │       │ fontSize        │       │ lastSyncAt      │
└────────┬────────┘       └─────────────────┘       │ syncStatus      │
         │                                           └─────────────────┘
         │ 1:N
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                              Exercise                                │
│──────────────────────────────────────────────────────────────────────│
│ id (PK)              │ userId (FK)         │ title                   │
│ rawText              │ rawImagePath        │ rawPdfPath              │
│ inputType            │ ocrText             │ latexText               │
│ subject              │ difficulty          │ grade                   │
│ source               │ status              │ createdAt/updatedAt     │
└────────┬─────────────────────────────────────────────────────────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Analysis     │       │  KnowledgeTag   │       │  ExerciseTag    │
│─────────────────│       │─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │       │ exerciseId (FK) │
│ exerciseId (FK) │──M:N──│ name            │──M:N──│ tagId (FK)      │
│ physicsScene    │       │ category        │       └─────────────────┘
│ aiMode          │       │ parentId (FK)   │
│ aiModel         │       │ description     │
│ parseDurationMs │       │ level           │
│ confidenceScore │       └────────┬────────┘
│ status          │                │
│ errorMessage    │                │ 1:N
│ createdAt       │                ▼
└────────┬────────┘       ┌─────────────────┐
         │                │KnowledgeRelation│
         │ 1:N            │─────────────────│
         ▼                │ id (PK)         │
┌─────────────────┐       │ sourceId (FK)   │
│ ExperimentRecord│       │ targetId (FK)   │
│─────────────────│       │ relationType    │
│ id (PK)         │       │ weight          │
│ analysisId (FK) │       └─────────────────┘
│ params          │
│ durationMs      │
│ interactionLog  │
│ createdAt       │
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   ErrorBook     │       │    Favorite     │       │  LearningRecord │
│─────────────────│       │─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ userId (FK)     │       │ userId (FK)     │       │ userId (FK)     │
│ exerciseId (FK) │       │ exerciseId (FK) │       │ exerciseId (FK) │
│ errorType       │       │ folderId (FK)   │       │ actionType      │
│ userAnswer      │       │ note            │       │ durationMs      │
│ notes           │       │ sortOrder       │       │ metadata        │
│ reviewCount     │       │ createdAt       │       │ createdAt       │
│ mastered        │       └─────────────────┘       └─────────────────┘
│ nextReviewAt    │
│ createdAt       │       ┌─────────────────┐
│ updatedAt       │       │  FavoriteFolder │
└─────────────────┘       │─────────────────│
                           │ id (PK)         │
                           │ userId (FK)     │
                           │ name            │
                           │ color           │
                           │ icon            │
                           │ sortOrder       │
                           │ createdAt       │
                           └─────────────────┘
```

---

## 3. 表结构详细设计

### 3.1 User

用户账户表。Phase 1 MVP 可使用默认本地用户，用户系统在 Phase 5 完善。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 用户唯一标识 |
| username | TEXT | UNIQUE, NOT NULL | — | 用户名 |
| displayName | TEXT | — | — | 显示名称 |
| avatarPath | TEXT | — | — | 头像文件路径 |
| membershipTier | TEXT | NOT NULL | 'free' | 会员等级：free / pro / edu |
| membershipExpiresAt | DATETIME | — | — | 会员到期时间 |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- `idx_user_username` ON (username)

---

### 3.2 Settings

用户设置表，与 User 一对一。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 设置唯一标识 |
| userId | TEXT | FK→User.id, UNIQUE, NOT NULL | — | 所属用户 |
| theme | TEXT | NOT NULL | 'system' | 主题：light / dark / system |
| language | TEXT | NOT NULL | 'zh-CN' | 界面语言 |
| autoPlay | INTEGER | NOT NULL | 1 | 自动播放实验 |
| qualityLevel | TEXT | NOT NULL | 'auto' | 渲染质量：low / medium / high / auto |
| fontSize | INTEGER | NOT NULL | 14 | 正文字号 |
| showGrid | INTEGER | NOT NULL | 1 | 显示3D网格 |
| showAxes | INTEGER | NOT NULL | 1 | 显示坐标轴 |
| physicsEngineFPS | INTEGER | NOT NULL | 60 | 物理引擎帧率 |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

---

### 3.3 Exercise

题目表，存储用户输入的所有物理题目。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 题目唯一标识 |
| userId | TEXT | FK→User.id, NOT NULL | — | 所属用户 |
| title | TEXT | — | — | 题目标题（自动提取或手动填写） |
| rawText | TEXT | — | — | 原始文字输入 |
| rawImagePath | TEXT | — | — | 上传图片的文件路径 |
| rawPdfPath | TEXT | — | — | 上传PDF的文件路径 |
| inputType | TEXT | NOT NULL | — | 输入类型：text / image / pdf |
| ocrText | TEXT | — | — | OCR识别结果 |
| latexText | TEXT | — | — | LaTeX格式的题目文本 |
| subject | TEXT | — | — | 学科分类：mechanics / electromagnetism / optics / thermodynamics / waves / modern |
| difficulty | TEXT | — | — | 难度：easy / medium / hard / olympiad |
| grade | TEXT | — | — | 年级：junior_high / senior_high / college |
| source | TEXT | — | — | 题目来源标注 |
| status | TEXT | NOT NULL | 'pending' | 状态：pending / parsing / parsed / failed |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updatedAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- `idx_exercise_user` ON (userId, createdAt DESC)
- `idx_exercise_status` ON (status)
- `idx_exercise_subject` ON (subject)
- `idx_exercise_difficulty` ON (difficulty)

---

### 3.4 Analysis

解析结果表，存储 AI 对题目的解析结果（PhysicsScene）。与 Exercise 一对一。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 解析唯一标识 |
| exerciseId | TEXT | FK→Exercise.id, UNIQUE, NOT NULL | — | 所属题目 |
| physicsScene | TEXT | NOT NULL | — | PhysicsScene JSON 字符串 |
| aiMode | TEXT | NOT NULL | — | 使用的AI模式：quick / detailed / teacher / socratic |
| aiModel | TEXT | NOT NULL | — | AI模型标识（如 qwen2.5:7b） |
| parseDurationMs | INTEGER | — | — | 解析耗时（毫秒） |
| confidenceScore | REAL | — | — | AI置信度（0.0~1.0） |
| tokenUsed | INTEGER | — | — | Token消耗量 |
| status | TEXT | NOT NULL | 'completed' | 状态：completed / partial / failed |
| errorMessage | TEXT | — | — | 解析失败时的错误信息 |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `idx_analysis_exercise` ON (exerciseId)
- `idx_analysis_created` ON (createdAt DESC)

---

### 3.5 ExperimentRecord

实验记录表，存储用户每次运行实验的参数和交互行为。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 记录唯一标识 |
| analysisId | TEXT | FK→Analysis.id, NOT NULL | — | 所属解析 |
| params | TEXT | — | — | 用户调整的参数 JSON |
| durationMs | INTEGER | — | — | 实验运行时长（毫秒） |
| interactionLog | TEXT | — | — | 交互日志 JSON（旋转/缩放/拖拽等） |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `idx_experiment_analysis` ON (analysisId, createdAt DESC)

---

### 3.6 ErrorBook

错题本表，记录用户标记的错题及其复习状态。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 错题记录唯一标识 |
| userId | TEXT | FK→User.id, NOT NULL | — | 所属用户 |
| exerciseId | TEXT | FK→Exercise.id, NOT NULL | — | 错题题目 |
| errorType | TEXT | — | — | 错误类型：calculation / concept / careless / unknown |
| userAnswer | TEXT | — | — | 用户的错误答案 |
| notes | TEXT | — | — | 用户笔记 |
| reviewCount | INTEGER | NOT NULL | 0 | 已复习次数 |
| mastered | INTEGER | NOT NULL | 0 | 是否已掌握（0/1） |
| nextReviewAt | DATETIME | — | — | 下次复习时间（基于间隔重复算法） |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 加入时间 |
| updatedAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- `idx_errorbook_user` ON (userId, mastered, nextReviewAt)
- `idx_errorbook_exercise` ON (userId, exerciseId) UNIQUE

---

### 3.7 Favorite

收藏夹表，存储用户收藏的题目。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 收藏唯一标识 |
| userId | TEXT | FK→User.id, NOT NULL | — | 所属用户 |
| exerciseId | TEXT | FK→Exercise.id, NOT NULL | — | 收藏的题目 |
| folderId | TEXT | FK→FavoriteFolder.id | — | 所属收藏夹（NULL=默认收藏夹） |
| note | TEXT | — | — | 收藏备注 |
| sortOrder | INTEGER | NOT NULL | 0 | 排序序号 |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 收藏时间 |

**索引：**
- `idx_favorite_user` ON (userId, folderId, sortOrder)
- `idx_favorite_exercise` ON (userId, exerciseId) UNIQUE

---

### 3.8 FavoriteFolder

收藏夹文件夹表。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 文件夹唯一标识 |
| userId | TEXT | FK→User.id, NOT NULL | — | 所属用户 |
| name | TEXT | NOT NULL | — | 文件夹名称 |
| color | TEXT | — | — | 文件夹颜色标记 |
| icon | TEXT | — | — | 文件夹图标名称 |
| sortOrder | INTEGER | NOT NULL | 0 | 排序序号 |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `idx_folder_user` ON (userId, sortOrder)

---

### 3.9 LearningRecord

学习记录表，追踪用户的每次学习行为。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 记录唯一标识 |
| userId | TEXT | FK→User.id, NOT NULL | — | 所属用户 |
| exerciseId | TEXT | FK→Exercise.id | — | 相关题目（可选） |
| actionType | TEXT | NOT NULL | — | 行为类型：parse / experiment / review / favorite / error_mark |
| durationMs | INTEGER | — | — | 行为持续时间（毫秒） |
| metadata | TEXT | — | — | 附加数据 JSON |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 发生时间 |

**索引：**
- `idx_learning_user_date` ON (userId, createdAt DESC)
- `idx_learning_action` ON (actionType)

---

### 3.10 KnowledgePoint

知识点表，构建物理知识图谱的节点。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 知识点唯一标识 |
| name | TEXT | NOT NULL | — | 知识点名称（如"牛顿第二定律"） |
| category | TEXT | NOT NULL | — | 类别：mechanics / electromagnetism / optics / thermodynamics / waves / modern |
| parentId | TEXT | FK→KnowledgePoint.id | — | 父级知识点 |
| description | TEXT | — | — | 知识点描述 |
| level | INTEGER | NOT NULL | 1 | 层级深度（1=章, 2=节, 3=点） |
| formulas | TEXT | — | — | 关联公式 JSON 数组 |
| sortOrder | INTEGER | NOT NULL | 0 | 排序序号 |

**索引：**
- `idx_kp_category` ON (category)
- `idx_kp_parent` ON (parentId)
- `idx_kp_name` ON (name)

---

### 3.11 KnowledgeRelation

知识点关系表，知识图谱的边。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 关系唯一标识 |
| sourceId | TEXT | FK→KnowledgePoint.id, NOT NULL | — | 源知识点 |
| targetId | TEXT | FK→KnowledgePoint.id, NOT NULL | — | 目标知识点 |
| relationType | TEXT | NOT NULL | — | 关系类型：prerequisite / extends / applies / contradicts / related |
| weight | REAL | NOT NULL | 1.0 | 关系权重（0.0~1.0） |

**索引：**
- `idx_kr_source` ON (sourceId)
- `idx_kr_target` ON (targetId)
- `idx_kr_pair` ON (sourceId, targetId) UNIQUE

---

### 3.12 Tag

标签表，用于题目分类和检索。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 标签唯一标识 |
| name | TEXT | UNIQUE, NOT NULL | — | 标签名称 |
| category | TEXT | NOT NULL | — | 标签类别：topic / exam / method / custom |
| color | TEXT | — | — | 标签显示颜色 |
| usageCount | INTEGER | NOT NULL | 0 | 使用次数（冗余，加速排序） |
| createdAt | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- `idx_tag_category` ON (category)
- `idx_tag_usage` ON (usageCount DESC)

---

### 3.13 ExerciseTag

题目-标签关联表（多对多）。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| exerciseId | TEXT | FK→Exercise.id, NOT NULL | — | 题目ID |
| tagId | TEXT | FK→Tag.id, NOT NULL | — | 标签ID |

**主键：** (exerciseId, tagId)

---

### 3.14 SyncState

同步状态表，用于可选的云同步功能（Phase 5）。

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | TEXT | PK, UUID | — | 记录唯一标识 |
| entityType | TEXT | NOT NULL | — | 实体类型：exercise / analysis / errorbook / favorite 等 |
| entityId | TEXT | NOT NULL | — | 实体ID |
| localVersion | INTEGER | NOT NULL | 1 | 本地版本号 |
| remoteVersion | INTEGER | — | — | 远端版本号 |
| lastSyncAt | DATETIME | — | — | 最后同步时间 |
| syncStatus | TEXT | NOT NULL | 'pending' | 同步状态：pending / synced / conflict |

**索引：**
- `idx_sync_entity` ON (entityType, entityId) UNIQUE
- `idx_sync_status` ON (syncStatus)

---

## 4. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./physics-lab.db"
}

model User {
  id                  String            @id @default(uuid())
  username            String            @unique
  displayName         String?
  avatarPath          String?
  membershipTier      String            @default("free")
  membershipExpiresAt DateTime?
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  settings        Settings?
  exercises       Exercise[]
  errorBooks      ErrorBook[]
  favorites       Favorite[]
  favoriteFolders FavoriteFolder[]
  learningRecords LearningRecord[]
}

model Settings {
  id                String   @id @default(uuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  theme             String   @default("system")
  language          String   @default("zh-CN")
  autoPlay          Boolean  @default(true)
  qualityLevel      String   @default("auto")
  fontSize          Int      @default(14)
  showGrid          Boolean  @default(true)
  showAxes          Boolean  @default(true)
  physicsEngineFPS  Int      @default(60)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Exercise {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  title        String?
  rawText      String?
  rawImagePath String?
  rawPdfPath   String?
  inputType    String
  ocrText      String?
  latexText    String?
  subject      String?
  difficulty   String?
  grade        String?
  source       String?
  status       String   @default("pending")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  analysis        Analysis?
  errorBooks      ErrorBook[]
  favorites       Favorite[]
  learningRecords LearningRecord[]
  tags            ExerciseTag[]

  @@index([userId, createdAt])
  @@index([status])
  @@index([subject])
  @@index([difficulty])
}

model Analysis {
  id               String   @id @default(uuid())
  exerciseId       String   @unique
  exercise         Exercise @relation(fields: [exerciseId], references: [id])
  physicsScene     String
  aiMode           String
  aiModel          String
  parseDurationMs  Int?
  confidenceScore  Float?
  tokenUsed        Int?
  status           String   @default("completed")
  errorMessage     String?
  createdAt        DateTime @default(now())

  experiments ExperimentRecord[]

  @@index([createdAt])
}

model ExperimentRecord {
  id             String   @id @default(uuid())
  analysisId     String
  analysis       Analysis @relation(fields: [analysisId], references: [id])
  params         String?
  durationMs     Int?
  interactionLog String?
  createdAt      DateTime @default(now())

  @@index([analysisId, createdAt])
}

model ErrorBook {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  exerciseId   String
  exercise     Exercise  @relation(fields: [exerciseId], references: [id])
  errorType    String?
  userAnswer   String?
  notes        String?
  reviewCount  Int       @default(0)
  mastered     Boolean   @default(false)
  nextReviewAt DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@unique([userId, exerciseId])
  @@index([userId, mastered, nextReviewAt])
}

model Favorite {
  id         String         @id @default(uuid())
  userId     String
  user       User           @relation(fields: [userId], references: [id])
  exerciseId String
  exercise   Exercise       @relation(fields: [exerciseId], references: [id])
  folderId   String?
  folder     FavoriteFolder? @relation(fields: [folderId], references: [id])
  note       String?
  sortOrder  Int            @default(0)
  createdAt  DateTime       @default(now())

  @@unique([userId, exerciseId])
  @@index([userId, folderId, sortOrder])
}

model FavoriteFolder {
  id        String     @id @default(uuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  name      String
  color     String?
  icon      String?
  sortOrder Int        @default(0)
  createdAt DateTime   @default(now())

  favorites Favorite[]

  @@index([userId, sortOrder])
}

model LearningRecord {
  id         String    @id @default(uuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id])
  exerciseId String?
  exercise   Exercise? @relation(fields: [exerciseId], references: [id])
  actionType String
  durationMs Int?
  metadata   String?
  createdAt  DateTime  @default(now())

  @@index([userId, createdAt])
  @@index([actionType])
}

model KnowledgePoint {
  id          String              @id @default(uuid())
  name        String
  category    String
  parentId    String?
  parent      KnowledgePoint?     @relation("KnowledgeHierarchy", fields: [parentId], references: [id])
  children    KnowledgePoint[]    @relation("KnowledgeHierarchy")
  description String?
  level       Int                 @default(1)
  formulas    String?
  sortOrder   Int                 @default(0)
  createdAt   DateTime            @default(now())

  sourceRelations KnowledgeRelation[] @relation("SourceKnowledge")
  targetRelations KnowledgeRelation[] @relation("TargetKnowledge")

  @@index([category])
  @@index([parentId])
  @@index([name])
}

model KnowledgeRelation {
  id           String         @id @default(uuid())
  sourceId     String
  source       KnowledgePoint @relation("SourceKnowledge", fields: [sourceId], references: [id])
  targetId     String
  target       KnowledgePoint @relation("TargetKnowledge", fields: [targetId], references: [id])
  relationType String
  weight       Float          @default(1.0)

  @@unique([sourceId, targetId])
  @@index([sourceId])
  @@index([targetId])
}

model Tag {
  id         String        @id @default(uuid())
  name       String        @unique
  category   String
  color      String?
  usageCount Int           @default(0)
  createdAt  DateTime      @default(now())

  exercises ExerciseTag[]

  @@index([category])
  @@index([usageCount])
}

model ExerciseTag {
  exerciseId String
  exercise   Exercise @relation(fields: [exerciseId], references: [id])
  tagId      String
  tag        Tag      @relation(fields: [tagId], references: [id])

  @@id([exerciseId, tagId])
}

model SyncState {
  id            String    @id @default(uuid())
  entityType    String
  entityId      String
  localVersion  Int       @default(1)
  remoteVersion Int?
  lastSyncAt    DateTime?
  syncStatus    String    @default("pending")

  @@unique([entityType, entityId])
  @@index([syncStatus])
}
```

---

## 5. 数据生命周期管理

### 5.1 过期数据清理策略

| 数据类型 | 保留策略 | 说明 |
|----------|----------|------|
| ExperimentRecord | 保留最近1000条/题目 | 超出自动清理最早记录 |
| LearningRecord | 保留最近1年 | 超过1年的记录归档或删除 |
| SyncState | 实时更新 | 仅用于同步追踪，不积累 |

### 5.2 数据库迁移策略

- 使用 Prisma Migrate 管理 Schema 版本
- 每次迁移生成独立的 SQL 迁移文件
- 迁移文件纳入版本控制
- 支持向前和向后兼容

### 5.3 备份策略

- 用户可手动导出数据库文件（`.db`）
- 自动本地备份，保留最近 5 个版本
- 备份文件存储于 `%APPDATA%/PhysicsLab/backups/`

---

## 6. 性能考量

### 6.1 查询优化

- PhysicsScene 字段使用 TEXT 类型存储 JSON，不在 SQL 层解析
- 列表查询默认分页（每页 20 条）
- 全文搜索使用 FTS5 虚拟表
- 高频查询字段建立覆盖索引

### 6.2 写入优化

- 批量插入使用事务
- ExperimentRecord 使用 WAL 模式写入
- 大字段（physicsScene JSON）延迟写入

### 6.3 FTS5 全文搜索

```sql
CREATE VIRTUAL TABLE exercise_fts USING fts5(
  title,
  rawText,
  ocrText,
  content='Exercise',
  content_rowid='rowid'
);

CREATE TRIGGER exercise_ai AFTER INSERT ON Exercise BEGIN
  INSERT INTO exercise_fts(rowid, title, rawText, ocrText)
  VALUES (new.rowid, new.title, new.rawText, new.ocrText);
END;

CREATE TRIGGER exercise_ad AFTER DELETE ON Exercise BEGIN
  INSERT INTO exercise_fts(exercise_fts, rowid, title, rawText, ocrText)
  VALUES ('delete', old.rowid, old.title, old.rawText, old.ocrText);
END;

CREATE TRIGGER exercise_au AFTER UPDATE ON Exercise BEGIN
  INSERT INTO exercise_fts(exercise_fts, rowid, title, rawText, ocrText)
  VALUES ('delete', old.rowid, old.title, old.rawText, old.ocrText);
  INSERT INTO exercise_fts(rowid, title, rawText, ocrText)
  VALUES (new.rowid, new.title, new.rawText, new.ocrText);
END;
```

---

## 7. 附录

### 7.1 枚举值参考

| 字段 | 可选值 |
|------|--------|
| membershipTier | free, pro, edu |
| theme | light, dark, system |
| language | zh-CN, en-US, zh-TW |
| qualityLevel | low, medium, high, auto |
| inputType | text, image, pdf |
| subject | mechanics, electromagnetism, optics, thermodynamics, waves, modern |
| difficulty | easy, medium, hard, olympiad |
| grade | junior_high, senior_high, college |
| exerciseStatus | pending, parsing, parsed, failed |
| aiMode | quick, detailed, teacher, socratic |
| analysisStatus | completed, partial, failed |
| actionType | parse, experiment, review, favorite, error_mark, share, export |
| errorType | calculation, concept, careless, unknown |
| relationType | prerequisite, extends, applies, contradicts, related |
| tagCategory | topic, exam, method, custom |
| syncStatus | pending, synced, conflict |

### 7.2 参考文档

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 技术架构
- [PRD.md](./PRD.md) - 产品需求文档
- [API_SPEC.md](./API_SPEC.md) - 前后端接口规范

### 7.3 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-06-24 | 初始版本，包含完整ER图和14张表 | Physics Lab 架构组 |
