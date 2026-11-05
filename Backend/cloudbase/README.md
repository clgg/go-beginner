# 围棋入门 CloudBase

开发阶段共用《疯狂切》的联调环境，不共用它的函数、路由和集合。密钥只放在函数环境变量里，不提交到仓库。

| 项目 | 内容 |
| --- | --- |
| 项目代号 | gobeginner |
| 仓库与后端目录 | GoBeginner / Backend/cloudbase |
| 开发环境 ID | individual-llama-d4e2yugb3aeb228 |
| 生产环境 | 仍用上面的联调环境。正式对外或要存私人数据时再单独建环境 |
| 函数 | gobeginner-api-dev，Node.js 20，端口 9000，超时 20 秒 |
| 测试 URL | https://individual-llama-d4e2yugb3aeb228-1524145598.ap-shanghai.app.tcloudbase.com/gobeginner/dev/v1 |
| 数据 | 前缀 gobeginner_dev_，权限 ADMINONLY。当前还没有集合，业务写入时再按这个前缀新建 |
| 存储桶 | 公开语音以后用 gobeginner-dev-assets。现在语音仍在 GitHub Pages |
| 登录 | 网关不开启 CloudBase 登录。以后的会话在函数内校验 |
| 环境变量 | CLOUDBASE_ENV_ID；CLOUDBASE_APIKEY 用本项目自己的 Key，在控制台注入。登录做好后再加 SESSION_KEY、WECHAT_APP_SECRET |
| 小程序 AppID | wx74c735f75cedd864。不要使用《疯狂切》的 AppID |

客户端只保存上面的测试 URL。网页在 `js/net.js`，小程序在 `miniprogram/utils/net.js`。请求一律 `POST` JSON，用 `action` 区分操作。现在可用的是 `ping`，成功时返回 `{ "ok": true, "project": "gobeginner" }`。

## 部署

1. 在环境 `individual-llama-d4e2yugb3aeb228` 新建 HTTP 云函数 `gobeginner-api-dev`。
2. 运行时选 Node.js 20。启动脚本使用本目录的 `scf_bootstrap`，并保留可执行权限。
3. 上传本目录时排除 `node_modules`，或让控制台按 `package-lock.json` 安装依赖。不要上传 `.env`。
4. 环境变量填写 `CLOUDBASE_ENV_ID=individual-llama-d4e2yugb3aeb228`，并注入本项目专用的 API Key。
5. HTTP 网关添加路由 `/gobeginner/dev/v1`，指向该函数。不要求网关鉴权。函数不读取路径，只处理 POST JSON。
6. 小程序后台把 `individual-llama-d4e2yugb3aeb228-1524145598.ap-shanghai.app.tcloudbase.com` 加到 request 合法域名。

本地检查：

```sh
cd Backend/cloudbase
npm ci
npm test
node --check server.js
```

发布后用下面的请求确认函数已经接上。未部署时，网页和小程序里的这一次请求会失败，棋盘仍可离线使用。

```sh
curl -sS -X POST \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://clgg.github.io' \
  -d '{"action":"ping"}' \
  https://individual-llama-d4e2yugb3aeb228-1524145598.ap-shanghai.app.tcloudbase.com/gobeginner/dev/v1
```
