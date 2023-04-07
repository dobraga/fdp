import { Router, send } from "oak";

const router = new Router();

router.get("/", async (ctx) => {
  await ctx.send({
    root: `${Deno.cwd()}/app/static`,
    index: "index.html",
  });
});

// Static content
router.get("/static/:path+", async (ctx) => {
  await send(ctx, ctx.request.url.pathname, {
    root: `${Deno.cwd()}/app/`,
  });
});

export default router;
