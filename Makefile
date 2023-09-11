include .env

# FRONTEND
# Envs from .env for frontend:
# 	- FRONTEND_STREAMER_APP_URL
# 	- FRONTEND_STREAMER_SOCKET_URL
# 	- FRONTEND_PLAYER_SOCKET_URL
#   - FRONTEND_DOCKER_REGISTRY
export FRONTEND_DOCKER_ARTEFACT_TAG=webcam-frontend

build-frontend:
	docker build \
		-t ${FRONTEND_DOCKER_ARTEFACT_TAG} \
		-f ./packages/frontend/Dockerfile \
		--build-arg VITE_STREAMER_APP_URL=${FRONTEND_STREAMER_APP_URL} \
		--build-arg VITE_STREAMER_SOCKET_URL=${FRONTEND_STREAMER_SOCKET_URL} \
		--build-arg VITE_PLAYER_SOCKET_URL=${FRONTEND_PLAYER_SOCKET_URL} \
		.

push-frontend:
	docker tag ${FRONTEND_DOCKER_ARTEFACT_TAG} ${FRONTEND_DOCKER_REGISTRY} && docker push ${FRONTEND_DOCKER_REGISTRY}

# STREAMER
# Envs from .env for streamer:
# 	- STREAMER_DOCKER_REGISTRY
# 	- STREAMER_IMAGE_SOCKET_SERVER_URL
export STREAMER_DOCKER_ARTEFACT_TAG=webcam-streamer-backend

build-streamer:
	docker build \
		-t ${STREAMER_DOCKER_ARTEFACT_TAG} \
		-f ./packages/backend/apps/streamer/Dockerfile \
		--build-arg IMAGE_SOCKET_SERVER_URL=${STREAMER_IMAGE_SOCKET_SERVER_URL} \
		.

push-streamer:
	docker tag ${STREAMER_DOCKER_ARTEFACT_TAG} ${STREAMER_DOCKER_REGISTRY} && docker push ${STREAMER_DOCKER_REGISTRY}

# STREAMER
# Envs from .env for streamer:
# 	- VISUALIZER_DOCKER_REGISTRY
export VISUALIZER_DOCKER_ARTEFACT_TAG=webcam-visualizer-backend

build-visualizer:
	docker build \
		-t ${VISUALIZER_DOCKER_ARTEFACT_TAG} \
		-f ./packages/backend/apps/visualizer/Dockerfile \
		.

push-visualizer:
	docker tag ${VISUALIZER_DOCKER_ARTEFACT_TAG} ${VISUALIZER_DOCKER_REGISTRY} && docker push ${VISUALIZER_DOCKER_REGISTRY}

build-push-frontend: build-frontend push-frontend
build-push-streamer: build-streamer push-streamer
build-push-visualizer: build-visualizer push-visualizer
build-push-all: build-push-frontend build-push-streamer build-push-visualizer

# k8s
apply:
	kubectl apply -f k8s/deployment.yaml

deploy-frontend:
	kubectl -n webcam delete pods $$(kubectl -n webcam get pods | grep frontend-deployment | awk '{ print $$1 }')

deploy-streamer:
	kubectl -n webcam delete pods $$(kubectl -n webcam get pods | grep streamer-backend-deployment | awk '{ print $$1 }')

deploy-visualizer:
	kubectl -n webcam delete pods $$(kubectl -n webcam get pods | grep visualizer-backend-deployment | awk '{ print $$1 }')

deploy-all: deploy-frontend deploy-streamer deploy-visualizer

#all
build-push-deploy-frontend: build-push-frontend deploy-frontend
build-push-deploy-streamer: build-push-streamer deploy-streamer
build-push-deploy-visualizer: build-push-visualizer deploy-visualizer
build-push-deploy-all: build-push-deploy-frontend build-push-deploy-streamer build-push-deploy-visualizer

#logs
logs-streamer:
	kubectl -n webcam logs $$(kubectl -n webcam get pods | grep streamer-backend-deployment | awk '{ print $$1 }')

logs-visualizer:
	kubectl -n webcam logs $$(kubectl -n webcam get pods | grep visualizer-backend-deployment | awk '{ print $$1 }')

# resource
top-streamer:
	kubectl -n webcam top pod $$(kubectl -n webcam get pods | grep streamer-backend-deployment | awk '{ print $$1 }') --containers