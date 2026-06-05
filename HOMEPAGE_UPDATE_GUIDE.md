# 个人主页更新维护指南

本目录是以后维护个人主页的固定目录：

```bash
cd /Users/wangzhouzhou/WJZ_homepage_setting
```

当前项目是 Hugo 静态网站，远程仓库为：

```text
https://github.com/Jiangzhou-Wang/faculty-homepage-v2.git
```

GitHub Pages 地址为：

```text
https://jiangzhou-wang.github.io/faculty-homepage-v2/
```

## 1. 进入主页项目目录

每次修改主页前，先进入固定目录：

```bash
cd /Users/wangzhouzhou/WJZ_homepage_setting
```

检查当前 Git 状态：

```bash
git status
```

如果看到 `Your branch is up to date with 'origin/main'` 且没有未提交文件，说明本地目录是干净的。

## 2. 启动本地预览

本项目不是 npm/React/Vite/Vue/Next.js 项目，不需要运行 `npm install` 或 `npm run build`。

本地预览建议使用 Hugo：

```bash
env HUGO_CACHEDIR=/private/tmp/hugo_cache_wjz_homepage_setting hugo server --bind 127.0.0.1 --port 1313
```

然后在浏览器打开：

```text
http://127.0.0.1:1313/faculty-homepage-v2/
```

如果只想检查能否构建，可以运行：

```bash
env HUGO_CACHEDIR=/private/tmp/hugo_cache_wjz_homepage_setting hugo --gc --minify
```

## 3. 修改 About / 首页简介

首页正文内容主要在：

```text
content/_index.md
```

首页结构、精选论文、News 摘要和首页联系方式在：

```text
layouts/index.html
```

一般只改 `content/_index.md` 即可。除非需要调整首页布局，否则不要随便改 `layouts/index.html`。

## 4. 新增或修改 Publications

论文页面内容在：

```text
content/publications.md
```

修改方法：

1. 按现有列表格式新增论文；
2. 尽量保留论文标题、作者、期刊/会议、年份、链接和引用量说明；
3. Google Scholar 引用量会变化，更新前建议再次核验；
4. 不确定的信息标注“待核验”，不要编造 DOI、期刊卷期或引用量。

首页精选论文列表在：

```text
layouts/index.html
```

如果只更新完整论文列表，优先修改 `content/publications.md`。

## 5. 更新 News

News 页面内容在：

```text
content/news.md
```

首页 News 时间线在：

```text
layouts/index.html
```

建议格式：

```markdown
- 2026-06：新增一条科研、教学、论文或项目动态。
```

保持时间顺序清晰，最新动态放在前面。

## 6. 修改 Teaching

教学页面内容在：

```text
content/teaching.md
```

可以在这里更新：

- 课程名称；
- 教学理念；
- 教学经验；
- 面向本科生、研究生或博士生的课程信息。

## 7. 修改 Contact

联系方式页面内容在：

```text
content/contact.md
```

全站通用联系信息在：

```text
config.toml
```

常见字段包括：

```toml
email = "wangjz695@szu.edu.cn"
office = "汇星楼440"
officePhone = "待补充"
collegePhone = "0755-26534791"
googleScholar = "..."
homepage = "..."
universityProfile = "..."
orcid = ""
```

如果邮箱、办公室、电话或学术链接发生变化，优先修改 `config.toml`，再检查 `content/contact.md` 是否也需要同步。

## 8. 图片放在哪里

图片源文件放在：

```text
static/images/
```

当前证件照文件为：

```text
static/images/wang-jiangzhou.jpg
```

如果替换照片，建议：

1. 使用清晰、正式、适合高校教师主页的照片；
2. 文件名尽量使用英文或拼音；
3. 放入 `static/images/`；
4. 在 `config.toml` 中更新：

```toml
photo = "images/your-photo-file.jpg"
```

## 9. 修改后检查效果

修改后先运行：

```bash
env HUGO_CACHEDIR=/private/tmp/hugo_cache_wjz_homepage_setting hugo --gc --minify
```

如果构建成功，再启动本地预览：

```bash
env HUGO_CACHEDIR=/private/tmp/hugo_cache_wjz_homepage_setting hugo server --bind 127.0.0.1 --port 1313
```

浏览器打开：

```text
http://127.0.0.1:1313/faculty-homepage-v2/
```

重点检查：

- 首页姓名、职位、学院、研究方向；
- 照片是否清晰；
- 导航链接是否正常；
- Publications 是否排版整齐；
- News 时间线是否正常；
- Teaching 和 Contact 页面是否正常；
- 手机窄屏下是否没有明显错位。

## 10. 提交并发布到 GitHub Pages

确认本地效果无误后，提交并推送：

```bash
git status
git add -A
git commit -m "Update faculty homepage"
git push
```

推送后 GitHub Actions 会自动部署到：

```text
https://jiangzhou-wang.github.io/faculty-homepage-v2/
```

可以查看部署状态：

```bash
gh run list --repo Jiangzhou-Wang/faculty-homepage-v2 --limit 5
```

## 11. 不要随便改的文件

以下文件和目录一般不要随便改：

```text
.git/
.github/workflows/hugo-pages.yml
config.toml 中的 baseURL
layouts/
static/css/main.css
static/js/clock.js
public/
.gitignore
```

说明：

- `.git/` 保存版本历史，不要删除；
- `.github/workflows/hugo-pages.yml` 控制 GitHub Pages 自动部署；
- `baseURL` 必须保持为 `https://jiangzhou-wang.github.io/faculty-homepage-v2/`；
- `layouts/` 控制页面模板，改错会影响全站；
- `static/css/main.css` 控制视觉样式；
- `static/js/clock.js` 控制动态时钟；
- `public/` 是 Hugo 构建生成目录，不建议手动编辑；
- `.gitignore` 控制哪些文件不会被提交。

## 12. 不要提交的文件

不要提交以下文件：

```text
node_modules/
.env
.env.*
API key
密钥文件
*.pem
*.key
*.p12
*.pfx
本地缓存文件
```

如果不确定某个文件能不能提交，先运行：

```bash
git status
```

然后询问确认。

## 13. 推荐给 Codex 的更新指令格式

局部更新某一块内容时，可以这样说：

```text
请在 /Users/wangzhouzhou/WJZ_homepage_setting 中，只修改 Publications 页面，新增下面这篇论文，不要改页面设计。
```

或者：

```text
请在 /Users/wangzhouzhou/WJZ_homepage_setting 中，更新 News 页面，增加 2026 年某条动态，修改后运行 Hugo 构建检查，但不要推送。
```

如果需要发布，可以明确说：

```text
请在 /Users/wangzhouzhou/WJZ_homepage_setting 中，修改 Contact 信息，检查无误后提交并推送到 GitHub Pages。
```
