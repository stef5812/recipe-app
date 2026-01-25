.PHONY: up down restart logs psql schema status

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker compose down
	docker compose up -d

status:
	docker ps

logs:
	docker-compose logs -f db

psql:
	docker exec -it recipes_postgres psql -U recipes_user -d recipes_db

schema:
	docker exec -i recipes_postgres psql -U recipes_user -d recipes_db < db/schema.sql
