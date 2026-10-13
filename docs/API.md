# Data API (for scripts and AI agents)

An instance can hand out one **API key** so a script or an agent (e.g. Claude) can read and
import training data without signing in. Set it on the api container:

```bash
API_KEY=<long random string>     # unset = key access disabled
```

The key acts as the owner account but works **only** on `GET`/`PUT /api/data`. It can't use the
admin dashboard, push or sign-out endpoints. Treat it like the password: anyone holding it can
replace all of the data.

## Endpoints

All requests send `Authorization: Bearer <API_KEY>`.

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/data` | Returns `{ "state": <state> }`, or `{ "state": null }` if nothing has been saved yet |
| `PUT` | `/api/data` | Body `{ "state": <state> }` **replaces the whole state**. Returns `{ "ok": true, "ts": <ms> }` |
| `GET` | `/exercises.json` | Built-in exercise catalogue, no key needed: `[{ id, name, bodyPart, equipment, target }]` |

`PUT` replaces everything, so always import as **read → modify → write**:

1. `GET /api/data`. If `state` is `null`, start from `{ "unit": "kg", "workouts": [], "routines": [], "bodyweight": [], "exWeights": {}, "customEx": [] }`.
2. Add the new items to the arrays and leave every other key exactly as you got it.
3. `PUT /api/data` with the whole object.

The server stamps a key-authenticated write with the current time (`_ts`), so the app picks it up
on its next load. Reload the app afterwards. If a device made changes while it was offline,
it will push its own copy back over the import instead, so make sure the app is synced before
you import.

## State shape (the parts an import touches)

Weights are in the profile's unit, `state.unit` (`"kg"` or `"lb"`). Dates are local
`YYYY-MM-DD`. Times are Unix epoch **milliseconds**.

### `workouts[]`: one finished session

```json
{
  "id": "lq8x2k1abcd",
  "d": "2026-10-12",
  "start": 1791802800000,
  "end": 1791806400000,
  "routineId": null,
  "name": "Push day",
  "bw": 72.5,
  "entries": [
    {
      "id": "0025",
      "sets": [
        { "w": 60, "r": 8, "done": true },
        { "w": 60, "r": 7, "done": true, "rir": 1 }
      ],
      "topW": 60,
      "target": null
    }
  ],
  "prs": [],
  "vol": 900
}
```

- `id`: any unique string. The app uses `Date.now().toString(36)` followed by 5 random base-36 characters.
- `routineId`: the id of a `routines[]` entry, or `null` for a one-off session.
- `bw`: body weight that day, or `null`.
- `entries[].id`: an exercise id from `/exercises.json`, or from `state.customEx` (see below).
- `vol`: the sum of `w × r` over the rep sets. `prs` can be left `[]`.
- **One workout per date.** The app's own importer skips a date that already has a workout, so do the same to avoid duplicates.

Set shapes depend on the kind of exercise:

| Kind | Set | Notes |
|---|---|---|
| Reps (default) | `{ "w": 60, "r": 8, "done": true }` | Optional effort, pick one per set: `"rir": 0–6` or `"rpe": 6–10`. For bodyweight moves `w` is *added* load, usually `0`. |
| Timed hold | `{ "sec": 45, "w": 0, "done": true }` | |
| Cardio | `{ "min": 30, "speed": 10.5, "done": true }` | `speed` in km/h. Exercises with `bodyPart: "cardio"` are logged this way. |

Every logged set has `"done": true`.

### `bodyweight[]`

```json
{ "d": "2026-10-12", "w": 72.5, "t": 1791795600000 }
```

Keep one entry per date and keep the array sorted by `d`.

### `customEx[]`: exercises missing from the catalogue

When nothing in `/exercises.json` matches, add a custom exercise and use its id in `entries`:

```json
{ "id": "im-lq8x2k1abcd", "n": "landmine press", "custom": true, "eq": "custom", "tg": "", "desc": "", "bp": "chest" }
```

`bp` is one of the catalogue's `bodyPart` values. Match against the catalogue first; it has
about 1,300 exercises, and its names are lowercase (e.g. `"barbell bench press"`).

### `exWeights` (optional)

The app pre-fills the next session's weight from `exWeights[exerciseId] = { "w": <heaviest>, "d": "<date>" }`.
After importing, set it for each imported exercise from its newest workout, but only if that
date is on or after the existing entry's `d`.

## Example (curl)

```bash
K=...; B=http://gym.example:8080
curl -s -H "Authorization: Bearer $K" $B/api/data > state.json
# …edit state.json ({"state": {...}})…
curl -s -X PUT -H "Authorization: Bearer $K" -H 'Content-Type: application/json' \
     --data @state.json $B/api/data
```
