"""Black-box stress test: 20 edge-case scenarios against a running stack over HTTP.

Usage (stack running, e.g. `docker compose --profile app up`):
    python scripts/stress_test.py [base_url] [admin_email] [admin_password]
Defaults target the local Docker demo. Creates throwaway accounts (stress.*@gmail.com) and test
vehicles; the vehicles are deleted again at the end, accounts stay (the API has no user delete).
Never point it at a production deployment.
"""

import concurrent.futures
import sys
import uuid

import httpx

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
ADMIN = (sys.argv[2], sys.argv[3]) if len(sys.argv) > 3 else ("admin@example.com", "autovault-demo")
RUN = uuid.uuid4().hex[:6]  # keeps each run's accounts unique
client = httpx.Client(base_url=BASE, timeout=30)
results: list[tuple[str, bool, str]] = []
created_vehicle_ids: list[int] = []  # removed again at the end


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))


def email(tag: str) -> str:
    return f"stress.{RUN}.{tag}@gmail.com"  # gmail.com passes the mail-domain check


def register(addr: str, password: str = "secret123") -> httpx.Response:
    return client.post("/api/auth/register", json={"email": addr, "password": password})


def token(addr: str, password: str = "secret123") -> dict:
    r = client.post("/api/auth/login", json={"email": addr, "password": password})
    r.raise_for_status()
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def vehicle(headers: dict, **overrides) -> httpx.Response:
    body = {"make": "Stress", "model": f"Test-{RUN}", "category": "Sedan", "price": 20000, "quantity": 3}
    response = client.post("/api/vehicles", json={**body, **overrides}, headers=headers)
    if response.status_code == 201:
        created_vehicle_ids.append(response.json()["id"])
    return response


# 1. Registration happy path
alice = email("alice")
r = register(alice)
check("01 register a new account", r.status_code == 201, f"{r.status_code}")
user = token(alice)
admin = token(*ADMIN)

# 2. Same email twice
r = register(alice)
check("02 duplicate email rejected", r.status_code == 409, f"{r.status_code}")

# 3. Same email, different capitalisation (should be the same account)
r = register(alice.upper())
check("03 duplicate email in other case rejected", r.status_code == 409, f"{r.status_code} {r.text[:80]}")

# 4. Login with different capitalisation
r = client.post("/api/auth/login", json={"email": alice.upper(), "password": "secret123"})
check("04 login is case-insensitive on email", r.status_code == 200, f"{r.status_code}")

# 5. Bad email domains and short passwords
codes = [
    register(f"x.{RUN}@no-such-domain-zq8x7.com").status_code,
    register(f"x.{RUN}@gmial.con").status_code,
    register(email("short"), "1234567").status_code,
    register("not-an-email").status_code,
]
check(
    "05 undeliverable domain, typo domain, short password, junk email -> 422", codes == [422] * 4, f"{codes}"
)

# 6. Login failures look identical (no account enumeration)
wrong = client.post("/api/auth/login", json={"email": alice, "password": "wrong-pass"})
unknown = client.post("/api/auth/login", json={"email": email("ghost"), "password": "wrong-pass"})
check(
    "06 wrong password and unknown email give the same 401",
    wrong.status_code == unknown.status_code == 401 and wrong.json() == unknown.json(),
    f"{wrong.status_code}/{unknown.status_code}",
)

# 7. Forged and malformed tokens
codes = [
    client.get("/api/auth/me").status_code,
    client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.jwt"}).status_code,
    client.get("/api/auth/me", headers={"Authorization": user["Authorization"][:-4] + "abcd"}).status_code,
    client.get("/api/auth/me", headers={"Authorization": "Basic abc"}).status_code,
]
check("07 missing / garbage / tampered / wrong-scheme tokens -> 401", codes == [401] * 4, f"{codes}")

# 8. Regular user cannot do admin things
v = vehicle(user).json()
codes = [
    client.delete(f"/api/vehicles/{v['id']}", headers=user).status_code,
    client.post(f"/api/vehicles/{v['id']}/restock", json={"quantity": 5}, headers=user).status_code,
    client.get("/api/orders", headers=user).status_code,
]
check("08 user cannot delete, restock or list all orders -> 403", codes == [403] * 3, f"{codes}")

# 9. Vehicle validation
codes = [
    vehicle(user, price=0).status_code,
    vehicle(user, price=-5).status_code,
    vehicle(user, quantity=-1).status_code,
    vehicle(user, quantity=1.5).status_code,
    vehicle(user, make="   ").status_code,
    vehicle(user, make="x" * 101).status_code,
    vehicle(user, image_url="javascript:alert(1)").status_code,
    vehicle(user, price="lots").status_code,
]
check("09 invalid prices, quantities, text and URLs -> 422", codes == [422] * 8, f"{codes}")

# 10. Absurdly large numbers must be rejected, not crash the database
codes = [
    vehicle(user, price=1e15).status_code,
    vehicle(user, quantity=10**12).status_code,
    client.post(f"/api/vehicles/{v['id']}/restock", json={"quantity": 10**12}, headers=admin).status_code,
]
check("10 huge price / quantity / restock -> 422, not 500", codes == [422] * 3, f"{codes}")

# 11. Hostile text is stored as plain text
r = vehicle(user, make="<script>alert(1)</script>", model="Ünïcødé 🚗 ' OR 1=1 --")
check(
    "11 HTML, SQL-ish and unicode text stored verbatim",
    r.status_code == 201 and r.json()["make"] == "<script>alert(1)</script>",
    f"{r.status_code}",
)

# 12. Search edge cases
codes = [
    client.get("/api/vehicles/search", params={"min_price": 5, "max_price": 1}, headers=user).status_code,
    client.get("/api/vehicles/search", params={"min_price": -1}, headers=user).status_code,
    client.get("/api/vehicles/search", params={"max_price": "cheap"}, headers=user).status_code,
]
wild = client.get("/api/vehicles/search", params={"make": "%"}, headers=user)
check(
    "12 bad price ranges -> 422; '%' is literal, not a wildcard",
    codes == [422] * 3 and wild.status_code == 200 and wild.json() == [],
    f"{codes} wildcard={len(wild.json()) if wild.status_code == 200 else wild.status_code}",
)

# 13. Purchasing odd ids
codes = [
    client.post("/api/vehicles/999999999/purchase", headers=user).status_code,
    client.post("/api/vehicles/0/purchase", headers=user).status_code,
    client.post("/api/vehicles/abc/purchase", headers=user).status_code,
    client.post("/api/vehicles/99999999999999999999/purchase", headers=user).status_code,
]
check(
    "13 missing / zero / non-numeric / overflowing ids -> 404 or 422",
    all(c in (404, 422) for c in codes),
    f"{codes}",
)

# 14. Checkout tampering
car = vehicle(user, price=10000, quantity=5).json()
bad = client.post(f"/api/vehicles/{car['id']}/purchase", json={"color": "gold_plated"}, headers=user)
cheat = client.post(
    f"/api/vehicles/{car['id']}/purchase",
    json={"total_price": 1, "addons": ["tinted_windows", "tinted_windows"]},
    headers=user,
)
charged = cheat.json()["order"]["total_price"] if cheat.status_code == 200 else cheat.status_code
check(
    "14 unknown option rejected; client price ignored; repeated add-on charged once",
    bad.status_code == 422 and cheat.status_code == 200 and cheat.json()["order"]["total_price"] == 10300,
    f"{bad.status_code} total={charged}",
)

# 15. Buy until sold out
car = vehicle(user, quantity=2).json()
codes = [client.post(f"/api/vehicles/{car['id']}/purchase", headers=user).status_code for _ in range(3)]
check("15 two in stock: buy, buy, then 409", codes == [200, 200, 409], f"{codes}")

# 16. Twenty buyers at once over HTTP, three in stock
car = vehicle(user, quantity=3).json()
buyers = []
for i in range(20):
    register(email(f"racer{i}"))
    buyers.append(token(email(f"racer{i}")))
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
    codes = list(
        pool.map(lambda h: client.post(f"/api/vehicles/{car['id']}/purchase", headers=h).status_code, buyers)
    )
stock = next(x["quantity"] for x in client.get("/api/vehicles", headers=user).json() if x["id"] == car["id"])
check(
    "16 20 parallel buyers, 3 in stock: exactly 3 succeed",
    codes.count(200) == 3 and stock == 0,
    f"200s={codes.count(200)} 409s={codes.count(409)} stock={stock}",
)

# 17. Updates that should change nothing
before = client.get("/api/vehicles", headers=user).json()
target = next(x for x in before if x["id"] == v["id"])
r1 = client.put(f"/api/vehicles/{v['id']}", json={}, headers=user)
r2 = client.put(f"/api/vehicles/{v['id']}", json={"price": None, "make": None}, headers=user)
check(
    "17 empty update and explicit nulls leave the vehicle unchanged",
    r1.json() == target == r2.json(),
    f"{r1.status_code}/{r2.status_code}",
)

# 18. Deleting a sold vehicle keeps the buyer's history
sold = vehicle(user, quantity=1).json()
client.post(f"/api/vehicles/{sold['id']}/purchase", headers=user)
deleted = client.delete(f"/api/vehicles/{sold['id']}", headers=admin).status_code
history = [o for o in client.get("/api/orders/me", headers=user).json() if o["model"] == sold["model"]]
check(
    "18 delete a sold car: 204, and the order stays in history",
    deleted == 204 and history and history[0]["vehicle_id"] is None,
    f"{deleted} orders={len(history)}",
)

# 19. Each user sees only their own orders
mine = client.get("/api/orders/me", headers=buyers[0]).json()
check("19 a buyer sees only their own orders", len(mine) <= 1, f"{len(mine)} orders")

# 20. Login spam: is there any throttling?
codes = [
    client.post("/api/auth/login", json={"email": alice, "password": f"guess{i}"}).status_code
    for i in range(30)
]
check("20 30 rapid wrong-password logins get throttled (429)", 429 in codes, f"{sorted(set(codes))}")

# Clean up: remove every test vehicle so the showroom is left as it was.
for vehicle_id in created_vehicle_ids:
    client.delete(f"/api/vehicles/{vehicle_id}", headers=admin)

width = max(len(n) for n, _, _ in results)
for name, ok, detail in results:
    print(f"{'PASS' if ok else 'FAIL'}  {name.ljust(width)}  {detail}")
print(f"\n{sum(ok for _, ok, _ in results)}/{len(results)} passed")
