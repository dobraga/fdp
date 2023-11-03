import { Router, send } from "oak";

const router = new Router();

router.get("/", async (ctx) => {
  await ctx.send({
    root: `${Deno.cwd()}/app/static`,
    index: "index.html",
  });
});

router.get("/favicon.ico", async (ctx) => {
  await send(ctx, "/favicon.ico", {
    root: `${Deno.cwd()}/app/static/`,
    index: "favicon.ico",
  });
});


// Static content
router.get("/static/:path+", async (ctx) => {
  await send(ctx, ctx.request.url.pathname, {
    root: `${Deno.cwd()}/app/`,
  });
});

export default router;
