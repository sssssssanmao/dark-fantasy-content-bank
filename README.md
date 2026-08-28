# 暗黑玄幻内容银行

这是第二阶段私有云端版，支持账号登录、跨电脑同步，以及灵感素材的新增、编辑、删除、搜索和筛选。

## 发布

1. 在 Supabase 项目的 SQL Editor 中运行 `supabase-schema.sql`。
2. 将本文件夹全部文件上传到 GitHub 仓库根目录并覆盖旧版。
3. 等待 GitHub Pages 自动更新。

安全说明：配置文件只包含浏览器可公开使用的 publishable key；数据库启用了行级安全，每个账号只能访问自己的素材。切勿上传数据库密码、Secret key 或 service_role key。
