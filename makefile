run:
	# denon run --allow-net --allow-read server.js
	denon run --allow-net --allow-read app/app.ts

deploy:
	docker tag deno_card_game us-east1-docker.pkg.dev/card-game-375100/deno-card-game/deno_card_game
	docker push us-east1-docker.pkg.dev/card-game-375100/deno-card-game/deno_card_game
	gcloud run deploy card-game --project card-game-375100 --region asia-east1\
	--image us-east1-docker.pkg.dev/card-game-375100/deno-card-game/deno_card_game
