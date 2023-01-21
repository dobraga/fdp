import { config } from "https://deno.land/x/dotenv/mod.ts"
import { Server } from "https://deno.land/x/socket_io/mod.ts"
import { Application } from "https://deno.land/x/oak/mod.ts"
import { serve } from "https://deno.land/std/http/server.ts"

import router from "./routes/ws.ts"
import createGame from "./static/game.js"

const io = new Server()
const app = new Application()
const game = createGame()
// game.subscribe((command) => {
//     console.log(`> Emitting "${command.type}"`)
//     io.emit(command.type, command)
// })

app.use(router.routes())
app.use(router.allowedMethods())

io.on("connection", (socket) => {
  var username = socket.id
  
  socket.on("new_user", (id) => {
    username = id
    game.addPlayer({'id': id})
    
    io.emit("new_user", {'id': id})
  })
  
  socket.emit('setup', game.players)

  socket.on("disconnect", () => {
    game.removePlayer({'id': username})
    io.emit("remove_user", {'id': username})
  })

  socket.on("selected_card", (command) => {
    console.log(`Selected card -> ${JSON.stringify(command)}`)
    game.finishRound(command)
    io.emit("finished_round", command)
  })
})

const handler = io.handler(async (req) => {
  return await app.handle(req) || new Response(null, { status: 404 })
})

await serve(handler, {
  hostname: config().HOST,
  port: config().PORT,
})
