"""Upper bounds that keep values inside what the database columns can hold.

Without them, an absurd price or stock level overflows NUMERIC(12,2) / INTEGER and the request
fails with a 500 instead of a clear 422.
"""

MAX_PRICE = 10_000_000  # USD; NUMERIC(12,2) could hold ~10 billion, no car costs that much
MAX_STOCK = 100_000  # units of one model; INTEGER tops out at ~2.1 billion
MAX_ID = 2_147_483_647  # largest value of a Postgres INTEGER primary key
