# 围棋入门

静态网页，用浏览器打开即可。包含教程、自由摆子、数气和死活题。

## 本地查看

在这个目录执行：

```bash
python3 -m http.server 8765
```

然后打开 `http://127.0.0.1:8765/`。直接双击 `index.html` 时，浏览器会拦截页面里的模块脚本。

规则检查：

```bash
node js/check.mjs
```

## 放到 GitHub Pages

1. 把这个目录推到一个公开仓库的主分支。
2. 打开仓库 Settings → Pages。
3. Build and deployment 选 Deploy from a branch，分支选 `main`，目录选 `/ (root)`。
4. 保存后访问 `https://用户名.github.io/仓库名/`。
