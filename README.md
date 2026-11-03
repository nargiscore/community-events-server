# Community Events API

Express + MongoDB server for the Social Development Events Platform.

## Endpoints
| Method | Route | Access |
|---|---|---|
| GET | `/events?limit=&type=&search=` | Public (upcoming only) |
| GET | `/events/:id` | Public |
| GET | `/events/mine` | JWT |
| POST | `/events` | JWT |
| PUT | `/events/:id` | JWT (owner only) |
| DELETE | `/events/:id` | JWT (owner only) |
| GET | `/joins` | JWT |
| POST | `/joins` | JWT |

JWTs are issued by BetterAuth on the client and verified here against its JWKS endpoint.

## Run
```bash
cp .env.example .env   # fill in values
npm install
npm run dev
```
