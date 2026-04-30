# personal-site

[佐纳](https://github.com/zoanun) 的个人主页 —— 用来展示我正在做的事、感兴趣的方向、以及一些成果。

## 技术栈

- [Next.js 16](https://nextjs.org) (App Router, Server Components)
- [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Geist](https://vercel.com/font) Sans / Mono via `next/font`
- 部署在 [Vercel](https://vercel.com),`main` 分支自动上线

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:3000。修改 [src/app/page.tsx](src/app/page.tsx) 即可看到热更新。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产构建 |
| `npm run lint` | ESLint 检查(core-web-vitals + TypeScript) |

## 项目结构

```
src/app/
├── layout.tsx     # 根布局,加载字体与全局样式
├── page.tsx       # 主页:Hero + 三个板块
└── globals.css    # Tailwind v4 设计令牌(@theme inline)
```

设计令牌、颜色、字体变量都在 [src/app/globals.css](src/app/globals.css) 的 `@theme inline` 块里,Tailwind v4 不用单独的 JS 配置文件。

## 部署

推到 `main` → Vercel 自动构建上线。无手动步骤。

## License

Personal project. All rights reserved.
